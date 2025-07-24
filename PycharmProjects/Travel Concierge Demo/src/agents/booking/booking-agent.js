const AgentBase = require('../core/agent-base');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');
const Stripe = require('stripe');
const logger = require('../../shared/utils/logger');
const { v4: uuidv4 } = require('uuid');

class BookingAgent extends AgentBase {
  constructor(config) {
    super('booking', config);
    this.firestore = new Firestore();
    this.pubsub = new PubSub();
    this.stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2023-08-16' });
    this.bookingTopic = config.bookingTopic;
    this.auditCollection = 'booking_audit_trail';
  }

  /**
   * Main entry point for orchestrator requests.
   */
  async processMessage(data) {
    const { sessionId, userId, action, bookingDetails, paymentToken, context } = data.payload;
    try {
      let response;
      switch (action) {
        case 'create_booking':
          response = await this.createBooking(bookingDetails, paymentToken, userId, sessionId, context);
          break;
        case 'cancel_booking':
          response = await this.cancelBooking(bookingDetails.bookingId, userId, sessionId);
          break;
        case 'refund_booking':
          response = await this.refundBooking(bookingDetails.bookingId, userId, sessionId);
          break;
        default:
          throw new Error(`Unknown booking action: ${action}`);
      }
      await this.sendMessage('orchestrator', {
        action: 'booking_response',
        sessionId,
        userId,
        response,
        agent: 'booking',
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('BookingAgent error:', error);
      await this.sendMessage('orchestrator', {
        action: 'booking_error',
        sessionId,
        userId,
        error: error.message,
        agent: 'booking',
        timestamp: Date.now()
      });
      await this.logAudit({
        type: 'error',
        sessionId,
        userId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Creates a booking and processes payment securely.
   */
  async createBooking(bookingDetails, paymentToken, userId, sessionId, context) {
    // Validate input
    if (!bookingDetails || !paymentToken) throw new Error('Missing booking details or payment token');
    // 1. Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(bookingDetails.totalAmount * 100), // cents
      currency: bookingDetails.currency || 'usd',
      payment_method: paymentToken,
      confirmation_method: 'automatic',
      confirm: true,
      metadata: {
        userId,
        sessionId,
        bookingType: bookingDetails.type
      }
    });
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment failed');
    }
    // 2. Store booking in Firestore
    const bookingId = uuidv4();
    const bookingRecord = {
      bookingId,
      userId,
      sessionId,
      bookingDetails,
      paymentIntentId: paymentIntent.id,
      status: 'confirmed',
      createdAt: new Date(),
      context
    };
    await this.firestore.collection('bookings').doc(bookingId).set(bookingRecord);
    // 3. Publish booking event
    await this.pubsub.topic(this.bookingTopic).publishJSON({
      bookingId,
      userId,
      sessionId,
      status: 'confirmed',
      bookingDetails,
      timestamp: Date.now()
    });
    // 4. Audit trail
    await this.logAudit({
      type: 'booking_created',
      bookingId,
      userId,
      sessionId,
      paymentIntentId: paymentIntent.id,
      amount: bookingDetails.totalAmount,
      timestamp: new Date()
    });
    return {
      bookingId,
      status: 'confirmed',
      paymentStatus: paymentIntent.status
    };
  }

  /**
   * Cancels a booking and updates status.
   */
  async cancelBooking(bookingId, userId, sessionId) {
    const bookingRef = this.firestore.collection('bookings').doc(bookingId);
    const booking = (await bookingRef.get()).data();
    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId) throw new Error('Unauthorized cancellation');
    await bookingRef.update({ status: 'cancelled', cancelledAt: new Date() });
    await this.logAudit({
      type: 'booking_cancelled',
      bookingId,
      userId,
      sessionId,
      timestamp: new Date()
    });
    return { bookingId, status: 'cancelled' };
  }

  /**
   * Issues a refund for a booking if eligible.
   */
  async refundBooking(bookingId, userId, sessionId) {
    const bookingRef = this.firestore.collection('bookings').doc(bookingId);
    const booking = (await bookingRef.get()).data();
    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId) throw new Error('Unauthorized refund');
    // Refund via Stripe
    const refund = await this.stripe.refunds.create({
      payment_intent: booking.paymentIntentId
    });
    await bookingRef.update({ status: 'refunded', refundedAt: new Date(), refundId: refund.id });
    await this.logAudit({
      type: 'booking_refunded',
      bookingId,
      userId,
      sessionId,
      refundId: refund.id,
      timestamp: new Date()
    });
    return { bookingId, status: 'refunded', refundId: refund.id };
  }

  /**
   * Logs all booking actions for audit/compliance.
   */
  async logAudit(auditRecord) {
    await this.firestore.collection(this.auditCollection).add({
      ...auditRecord,
      loggedAt: new Date()
    });
  }
}

module.exports = BookingAgent; 