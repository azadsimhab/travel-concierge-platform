// src/orchestrator/intent-analyzer.js
const { VertexAI } = require('@google-cloud/vertexai');

class IntentAnalyzer {
  constructor(config) {
    this.modelId = config.GEMINI_MODEL_ID;
    this.projectId = config.GCP_PROJECT_ID;
    this.location = config.GCP_LOCATION || 'us-central1';
    
    // Initialize Vertex AI client
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });
    
    this.model = this.vertexAI.getGenerativeModel({
      model: this.modelId,
    });
  }

  async analyze(userInput, sessionContext) {
    try {
      // Create a structured prompt for intent analysis
      const prompt = this.buildIntentAnalysisPrompt(userInput, sessionContext);
      
      // Generate content using Gemini
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent intent classification
          maxOutputTokens: 100,
        },
      });

      const response = result.response;
      const intent = this.parseIntentFromResponse(response.candidates[0].content.parts[0].text);
      
      return intent;
    } catch (error) {
      console.error('Error in Gemini intent analysis:', error);
      // Fallback to keyword-based detection
      return this.fallbackIntentDetection(userInput);
    }
  }

  buildIntentAnalysisPrompt(userInput, sessionContext) {
    const history = sessionContext.history ? sessionContext.history.slice(-5) : [];
    const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
    
    return `You are an intent classifier for a travel concierge system. Analyze the user's input and classify it into one of these intents:

INTENTS:
- booking: User wants to book flights, hotels, activities, or make reservations
- planning: User wants to plan an itinerary, schedule, or trip details
- inspiration: User wants travel ideas, recommendations, or destination suggestions
- trip-monitor: User wants to check trip status, get updates, or monitor their journey
- day-of: User needs real-time assistance during their trip (day-of support)
- general: General questions, greetings, or unclear requests

USER INPUT: "${userInput}"

RECENT CONVERSATION HISTORY:
${historyText || 'No recent history'}

USER CONTEXT: ${JSON.stringify(sessionContext, null, 2)}

Respond with ONLY the intent name (booking, planning, inspiration, trip-monitor, day-of, or general).`;
  }

  parseIntentFromResponse(responseText) {
    const text = responseText.toLowerCase().trim();
    
    // Extract intent from response
    const validIntents = ['booking', 'planning', 'inspiration', 'trip-monitor', 'day-of', 'general'];
    
    for (const intent of validIntents) {
      if (text.includes(intent)) {
        return intent;
      }
    }
    
    // Default fallback
    return 'general';
  }

  fallbackIntentDetection(userInput) {
    // Fallback keyword-based detection
    const text = userInput.toLowerCase();
    if (text.includes('book') || text.includes('reservation') || text.includes('flight') || text.includes('hotel')) {
      return 'booking';
    }
    if (text.includes('plan') || text.includes('itinerary') || text.includes('schedule')) {
      return 'planning';
    }
    if (text.includes('inspire') || text.includes('recommend') || text.includes('suggestion') || text.includes('idea')) {
      return 'inspiration';
    }
    if (text.includes('monitor') || text.includes('status') || text.includes('update') || text.includes('track')) {
      return 'trip-monitor';
    }
    if (text.includes('day') || text.includes('now') || text.includes('current') || text.includes('assist')) {
      return 'day-of';
    }
    return 'general';
  }
}

module.exports = IntentAnalyzer; 