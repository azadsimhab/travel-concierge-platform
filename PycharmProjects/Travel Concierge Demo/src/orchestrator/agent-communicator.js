// src/orchestrator/agent-communicator.js
const { v4: uuidv4 } = require('uuid');

class AgentCommunicator {
  constructor(pubsub, config) {
    this.pubsub = pubsub;
    this.config = config;
    
    // Map intents to agent Pub/Sub topics
    this.intentTopicMap = {
      'booking': 'booking-agent-requests',
      'planning': 'planning-agent-requests',
      'inspiration': 'inspiration-agent-requests',
      'trip-monitor': 'trip-monitor-agent-requests',
      'day-of': 'dayof-agent-requests',
      'general': 'root-agent-requests',
    };
    
    // Response topic for all agent responses
    this.responseTopic = 'agent-responses';
    this.responseSubscription = 'orchestrator-responses';
    
    // Track pending requests
    this.pendingRequests = new Map();
    
    // Initialize response listener
    this.initializeResponseListener();
  }

  async sendToAgent(intent, userInput, sessionContext) {
    const requestId = uuidv4();
    const topic = this.intentTopicMap[intent] || this.intentTopicMap['general'];
    
    try {
      // Create request message with JSON-RPC like structure
      const requestMessage = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'processRequest',
        params: {
          userInput,
          sessionContext,
          intent,
          timestamp: Date.now(),
        },
      };

      // Publish request to agent topic
      const messageBuffer = Buffer.from(JSON.stringify(requestMessage));
      await this.pubsub.topic(topic).publish(messageBuffer);
      
      console.log(`Published request to ${topic}`, { requestId, intent });
      
      // Wait for response with timeout
      const response = await this.waitForResponse(requestId, this.config.AGENT_REQUEST_TIMEOUT_MS);
      
      return {
        response: response.result.response,
        context: response.result.context || sessionContext,
      };
      
    } catch (error) {
      console.error(`Error sending request to agent ${intent}:`, error);
      
      // Return fallback response
      return {
        response: `I'm having trouble connecting to the ${intent} service right now. Please try again in a moment.`,
        context: { ...sessionContext, lastIntent: intent, lastInput: userInput, error: error.message },
      };
    }
  }

  initializeResponseListener() {
    const subscription = this.pubsub.subscription(this.responseSubscription);
    
    subscription.on('message', async (message) => {
      try {
        const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
        
        // Handle JSON-RPC response
        if (data.jsonrpc === '2.0' && data.id) {
          const pendingRequest = this.pendingRequests.get(data.id);
          if (pendingRequest) {
            // Resolve the pending request
            pendingRequest.resolve(data);
            this.pendingRequests.delete(data.id);
          }
        }
        
        message.ack();
      } catch (error) {
        console.error('Error processing agent response:', error);
        message.ack(); // Still ack to avoid redelivery
      }
    });
    
    subscription.on('error', (error) => {
      console.error('Agent response subscription error:', error);
    });
    
    console.log(`Initialized response listener on subscription: ${this.responseSubscription}`);
  }

  waitForResponse(requestId, timeoutMs) {
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }

  // Method to clean up pending requests (useful for graceful shutdown)
  cleanup() {
    for (const [requestId, pendingRequest] of this.pendingRequests) {
      pendingRequest.reject(new Error('Communicator cleanup'));
    }
    this.pendingRequests.clear();
  }
}

module.exports = AgentCommunicator; 