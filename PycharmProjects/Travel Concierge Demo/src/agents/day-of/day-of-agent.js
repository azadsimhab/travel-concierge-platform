const AgentBase = require('../core/agent-base');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');
const logger = require('../../shared/utils/logger');

class DayOfAgent extends AgentBase {
  constructor(config) {
    super('day-of', config);
    this.pubsub = new PubSub();
    this.firestore = new Firestore();
    this.googleMapsApiKey = config.googleMapsApiKey;
    this.googleTranslateApiKey = config.googleTranslateApiKey;
    this.dayOfTopic = config.dayOfTopic;
  }

  /**
   * Main entry point for orchestrator requests.
   */
  async processMessage(data) {
    const { sessionId, userId, action, parameters, context } = data.payload;
    try {
      let response;
      switch (action) {
        case 'get_navigation':
          response = await this.getNavigation(parameters);
          break;
        case 'emergency_assistance':
          response = await this.getEmergencyAssistance(parameters, context);
          break;
        case 'translate':
          response = await this.translateText(parameters);
          break;
        default:
          throw new Error(`Unknown day-of action: ${action}`);
      }
      await this.sendMessage('orchestrator', {
        action: 'dayof_response',
        sessionId,
        userId,
        response,
        agent: 'day-of',
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('DayOfAgent error:', error);
      await this.sendMessage('orchestrator', {
        action: 'dayof_error',
        sessionId,
        userId,
        error: error.message,
        agent: 'day-of',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Provides live navigation using Google Maps Directions API.
   */
  async getNavigation({ origin, destination, mode = 'driving' }) {
    if (!origin || !destination) throw new Error('Missing origin or destination');
    const url = `https://maps.googleapis.com/maps/api/directions/json`;
    const params = {
      origin,
      destination,
      mode,
      key: this.googleMapsApiKey
    };
    const res = await axios.get(url, { params });
    if (!res.data || res.data.status !== 'OK') {
      throw new Error('Navigation lookup failed');
    }
    return {
      route: res.data.routes[0],
      summary: res.data.routes[0]?.summary,
      legs: res.data.routes[0]?.legs
    };
  }

  /**
   * Provides emergency assistance info (SOS, embassy, medical).
   */
  async getEmergencyAssistance({ location, type }, context) {
    // For demo: static info, in prod: query Firestore or external APIs
    const emergencyData = {
      sos: {
        phone: '112',
        description: 'General emergency number (Europe/Global)'
      },
      embassy: {
        us: {
          phone: '+1-202-501-4444',
          address: 'US Embassy, [City]',
          website: 'https://travel.state.gov/'
        }
        // Add more embassies as needed
      },
      medical: {
        phone: '911',
        description: 'Medical emergency number (US)'
      }
    };
    // In production, use location/type to look up correct info
    return emergencyData[type] || emergencyData.sos;
  }

  /**
   * Provides real-time translation using Google Translate API.
   */
  async translateText({ text, target, source }) {
    if (!text || !target) throw new Error('Missing text or target language');
    const url = `https://translation.googleapis.com/language/translate/v2`;
    const params = {
      q: text,
      target,
      key: this.googleTranslateApiKey
    };
    if (source) params.source = source;
    const res = await axios.post(url, null, { params });
    if (!res.data || !res.data.data || !res.data.data.translations) {
      throw new Error('Translation failed');
    }
    return {
      translatedText: res.data.data.translations[0].translatedText,
      detectedSourceLanguage: res.data.data.translations[0].detectedSourceLanguage
    };
  }
}

module.exports = DayOfAgent; 