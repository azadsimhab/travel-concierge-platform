/**
 * Trip Planning Agent
 * Handles destination research, itinerary creation, and travel recommendations
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');
const { logger } = require('../../shared/logger');

class TripPlanningAgent {
  constructor(config) {
    this.config = config;
    this.vertexAI = new VertexAI({
      project: config.projectId,
      location: config.region,
    });
    this.firestore = new Firestore();
    this.pubsub = new PubSub();
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-2.0-ultra',
    });
  }

  /**
   * Process trip planning request
   */
  async processRequest(request) {
    try {
      logger.info('Processing trip planning request', {
        requestId: request.requestId,
        userId: request.userId,
        destination: request.destination,
      });

      const {
        destination,
        dates,
        budget,
        preferences,
        travelers,
        interests,
      } = request.data;

      // Step 1: Research destination
      const destinationInfo = await this.researchDestination(destination);

      // Step 2: Generate itinerary
      const itinerary = await this.generateItinerary({
        destination,
        destinationInfo,
        dates,
        budget,
        preferences,
        travelers,
        interests,
      });

      // Step 3: Find accommodations
      const accommodations = await this.findAccommodations({
        destination,
        dates,
        budget,
        travelers,
        preferences,
      });

      // Step 4: Find transportation
      const transportation = await this.findTransportation({
        destination,
        dates,
        budget,
        travelers,
      });

      // Step 5: Generate recommendations
      const recommendations = await this.generateRecommendations({
        destination,
        interests,
        budget,
        travelers,
      });

      // Step 6: Calculate costs
      const costBreakdown = await this.calculateCosts({
        itinerary,
        accommodations,
        transportation,
        travelers,
      });

      const response = {
        requestId: request.requestId,
        agentId: 'trip-planning',
        response: {
          message: `I've created a comprehensive travel plan for your trip to ${destination}!`,
          itinerary,
          accommodations,
          transportation,
          recommendations,
          costBreakdown,
          destinationInfo,
        },
        metadata: {
          processingTime: Date.now() - request.timestamp,
          tokensUsed: 0, // Will be updated by Vertex AI response
        },
      };

      // Save to Firestore
      await this.saveTripPlan(request.userId, response);

      logger.info('Trip planning request completed', {
        requestId: request.requestId,
        processingTime: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      logger.error('Error processing trip planning request', {
        requestId: request.requestId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Research destination information
   */
  async researchDestination(destination) {
    const prompt = `
      Research the following destination: ${destination}
      
      Provide comprehensive information including:
      - Best time to visit
      - Weather conditions
      - Local customs and culture
      - Safety considerations
      - Visa requirements
      - Language and communication
      - Currency and payment methods
      - Transportation options
      - Popular attractions
      - Local cuisine
      - Shopping opportunities
      
      Format the response as structured JSON with clear sections.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Generate detailed itinerary
   */
  async generateItinerary(params) {
    const {
      destination,
      destinationInfo,
      dates,
      budget,
      preferences,
      travelers,
      interests,
    } = params;

    const prompt = `
      Create a detailed day-by-day itinerary for a trip to ${destination}.
      
      Trip Details:
      - Dates: ${dates.start} to ${dates.end}
      - Budget: $${budget}
      - Travelers: ${travelers.count} (${travelers.type})
      - Interests: ${interests.join(', ')}
      - Preferences: ${JSON.stringify(preferences)}
      
      Destination Info: ${JSON.stringify(destinationInfo)}
      
      Create an itinerary that includes:
      - Daily activities and attractions
      - Recommended restaurants
      - Transportation between locations
      - Time allocations
      - Cost estimates
      - Booking recommendations
      
      Format as structured JSON with daily breakdowns.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Find suitable accommodations
   */
  async findAccommodations(params) {
    const { destination, dates, budget, travelers, preferences } = params;

    const prompt = `
      Find accommodation options for ${destination}.
      
      Requirements:
      - Dates: ${dates.start} to ${dates.end}
      - Budget: $${budget} total
      - Travelers: ${travelers.count} (${travelers.type})
      - Preferences: ${JSON.stringify(preferences)}
      
      Provide options including:
      - Hotels (luxury, mid-range, budget)
      - Vacation rentals
      - Hostels
      - Boutique accommodations
      
      For each option include:
      - Name and location
      - Price per night
      - Amenities
      - Booking platforms
      - Reviews and ratings
      - Cancellation policies
      
      Format as structured JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Find transportation options
   */
  async findTransportation(params) {
    const { destination, dates, budget, travelers } = params;

    const prompt = `
      Find transportation options for travel to ${destination}.
      
      Requirements:
      - Dates: ${dates.start} to ${dates.end}
      - Budget: $${budget}
      - Travelers: ${travelers.count}
      
      Provide options for:
      - Flights (if international/domestic)
      - Trains
      - Buses
      - Car rentals
      - Local transportation
      
      For each option include:
      - Provider and route
      - Duration and schedule
      - Price
      - Booking platforms
      - Cancellation policies
      
      Format as structured JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(params) {
    const { destination, interests, budget, travelers } = params;

    const prompt = `
      Generate personalized recommendations for ${destination}.
      
      Context:
      - Interests: ${interests.join(', ')}
      - Budget: $${budget}
      - Travelers: ${travelers.count} (${travelers.type})
      
      Provide recommendations for:
      - Must-see attractions
      - Hidden gems
      - Local experiences
      - Food and dining
      - Shopping
      - Nightlife
      - Day trips
      - Seasonal activities
      
      Include:
      - Why each recommendation is suitable
      - Cost estimates
      - Time requirements
      - Booking tips
      
      Format as structured JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Calculate detailed cost breakdown
   */
  async calculateCosts(params) {
    const { itinerary, accommodations, transportation, travelers } = params;

    const prompt = `
      Calculate a detailed cost breakdown for this trip.
      
      Trip Components:
      - Itinerary: ${JSON.stringify(itinerary)}
      - Accommodations: ${JSON.stringify(accommodations)}
      - Transportation: ${JSON.stringify(transportation)}
      - Travelers: ${travelers.count}
      
      Calculate costs for:
      - Accommodation (total for all nights)
      - Transportation (flights, local transport, transfers)
      - Activities and attractions
      - Food and dining
      - Shopping and souvenirs
      - Travel insurance
      - Visa fees (if applicable)
      - Tips and gratuities
      
      Provide:
      - Itemized breakdown
      - Total cost
      - Cost per person
      - Budget allocation percentages
      - Money-saving tips
      
      Format as structured JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  }

  /**
   * Save trip plan to Firestore
   */
  async saveTripPlan(userId, tripPlan) {
    try {
      const docRef = this.firestore
        .collection('trip-plans')
        .doc(userId)
        .collection('plans')
        .doc(tripPlan.requestId);

      await docRef.set({
        ...tripPlan,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Trip plan saved to Firestore', {
        userId,
        requestId: tripPlan.requestId,
      });
    } catch (error) {
      logger.error('Error saving trip plan to Firestore', {
        userId,
        requestId: tripPlan.requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user's trip history
   */
  async getTripHistory(userId) {
    try {
      const snapshot = await this.firestore
        .collection('trip-plans')
        .doc(userId)
        .collection('plans')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error('Error getting trip history', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update existing trip plan
   */
  async updateTripPlan(userId, requestId, updates) {
    try {
      const docRef = this.firestore
        .collection('trip-plans')
        .doc(userId)
        .collection('plans')
        .doc(requestId);

      await docRef.update({
        ...updates,
        updatedAt: new Date(),
      });

      logger.info('Trip plan updated', {
        userId,
        requestId,
      });
    } catch (error) {
      logger.error('Error updating trip plan', {
        userId,
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test Vertex AI connection
      await this.model.generateContent('Hello');
      
      // Test Firestore connection
      await this.firestore.collection('health').doc('test').get();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          vertexAI: 'connected',
          firestore: 'connected',
          pubsub: 'connected',
        },
      };
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }
}

module.exports = { TripPlanningAgent }; 