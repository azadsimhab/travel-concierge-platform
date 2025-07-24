// src/orchestrator/__tests__/agent-communicator.test.js
const AgentCommunicator = require('../agent-communicator');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-request-id-123')
}));

// Mock Pub/Sub
jest.mock('@google-cloud/pubsub', () => {
  const mockTopic = {
    publish: jest.fn().mockResolvedValue(['message-id-123'])
  };
  
  const mockSubscription = {
    on: jest.fn(),
  };
  
  const mockPubSub = {
    topic: jest.fn().mockReturnValue(mockTopic),
    subscription: jest.fn().mockReturnValue(mockSubscription),
  };
  
  return { PubSub: jest.fn().mockImplementation(() => mockPubSub) };
});

describe('AgentCommunicator', () => {
  let agentCommunicator;
  let mockPubSub;
  let mockTopic;
  let mockSubscription;
  let config;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup config
    config = {
      AGENT_REQUEST_TIMEOUT_MS: 30000
    };
    
    // Get mocked Pub/Sub instance
    const { PubSub } = require('@google-cloud/pubsub');
    mockPubSub = new PubSub();
    mockTopic = mockPubSub.topic();
    mockSubscription = mockPubSub.subscription();
    
    // Create AgentCommunicator instance
    agentCommunicator = new AgentCommunicator(mockPubSub, config);
  });

  describe('constructor', () => {
    it('should initialize with Pub/Sub and config', () => {
      expect(agentCommunicator.pubsub).toBe(mockPubSub);
      expect(agentCommunicator.config).toBe(config);
    });

    it('should set up intent topic mapping', () => {
      expect(agentCommunicator.intentTopicMap).toEqual({
        'booking': 'booking-agent-requests',
        'planning': 'planning-agent-requests',
        'inspiration': 'inspiration-agent-requests',
        'trip-monitor': 'trip-monitor-agent-requests',
        'day-of': 'dayof-agent-requests',
        'general': 'root-agent-requests',
      });
    });

    it('should initialize response topic and subscription', () => {
      expect(agentCommunicator.responseTopic).toBe('agent-responses');
      expect(agentCommunicator.responseSubscription).toBe('orchestrator-responses');
    });

    it('should initialize pending requests map', () => {
      expect(agentCommunicator.pendingRequests).toBeInstanceOf(Map);
      expect(agentCommunicator.pendingRequests.size).toBe(0);
    });

    it('should call initializeResponseListener', () => {
      expect(mockPubSub.subscription).toHaveBeenCalledWith('orchestrator-responses');
    });
  });

  describe('sendToAgent', () => {
    const userInput = 'I want to book a flight';
    const sessionContext = { userId: 'user-123', history: [] };
    const intent = 'booking';

    it('should send request to correct agent topic', async () => {
      // Mock successful response
      const mockResponse = {
        jsonrpc: '2.0',
        id: 'test-request-id-123',
        result: {
          response: 'I can help you book a flight',
          context: { ...sessionContext, lastIntent: intent }
        }
      };

      // Simulate response after a delay
      setTimeout(() => {
        const pendingRequest = agentCommunicator.pendingRequests.get('test-request-id-123');
        if (pendingRequest) {
          pendingRequest.resolve(mockResponse);
        }
      }, 100);

      const result = await agentCommunicator.sendToAgent(intent, userInput, sessionContext);

      expect(mockPubSub.topic).toHaveBeenCalledWith('booking-agent-requests');
      expect(mockTopic.publish).toHaveBeenCalledWith(
        expect.any(Buffer)
      );
      
      // Verify published message structure
      const publishedMessage = JSON.parse(mockTopic.publish.mock.calls[0][0].toString());
      expect(publishedMessage).toEqual({
        jsonrpc: '2.0',
        id: 'test-request-id-123',
        method: 'processRequest',
        params: {
          userInput,
          sessionContext,
          intent,
          timestamp: expect.any(Number)
        }
      });

      expect(result).toEqual({
        response: 'I can help you book a flight',
        context: { ...sessionContext, lastIntent: intent }
      });
    });

    it('should use general agent for unknown intent', async () => {
      const unknownIntent = 'unknown-intent';
      
      // Mock successful response
      const mockResponse = {
        jsonrpc: '2.0',
        id: 'test-request-id-123',
        result: {
          response: 'I can help with your request',
          context: sessionContext
        }
      };

      setTimeout(() => {
        const pendingRequest = agentCommunicator.pendingRequests.get('test-request-id-123');
        if (pendingRequest) {
          pendingRequest.resolve(mockResponse);
        }
      }, 100);

      await agentCommunicator.sendToAgent(unknownIntent, userInput, sessionContext);

      expect(mockPubSub.topic).toHaveBeenCalledWith('root-agent-requests');
    });

    it('should handle timeout correctly', async () => {
      // Don't resolve the request to simulate timeout
      const result = await agentCommunicator.sendToAgent(intent, userInput, sessionContext);

      expect(result).toEqual({
        response: 'I\'m having trouble connecting to the booking service right now. Please try again in a moment.',
        context: { ...sessionContext, lastIntent: intent, lastInput: userInput, error: 'Request timeout after 30000ms' }
      });
    });

    it('should handle publish errors', async () => {
      mockTopic.publish.mockRejectedValue(new Error('Publish failed'));

      const result = await agentCommunicator.sendToAgent(intent, userInput, sessionContext);

      expect(result).toEqual({
        response: 'I\'m having trouble connecting to the booking service right now. Please try again in a moment.',
        context: { ...sessionContext, lastIntent: intent, lastInput: userInput, error: 'Publish failed' }
      });
    });
  });

  describe('initializeResponseListener', () => {
    it('should set up message handler', () => {
      expect(mockSubscription.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should set up error handler', () => {
      expect(mockSubscription.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle valid JSON-RPC response', () => {
      const mockMessage = {
        data: Buffer.from(JSON.stringify({
          jsonrpc: '2.0',
          id: 'test-request-id-123',
          result: { response: 'Test response' }
        })).toString('base64'),
        ack: jest.fn()
      };

      // Add a pending request
      agentCommunicator.pendingRequests.set('test-request-id-123', {
        resolve: jest.fn(),
        reject: jest.fn()
      });

      // Get the message handler
      const messageHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler(mockMessage);

      expect(mockMessage.ack).toHaveBeenCalled();
      expect(agentCommunicator.pendingRequests.has('test-request-id-123')).toBe(false);
    });

    it('should handle invalid JSON response', () => {
      const mockMessage = {
        data: 'invalid-json',
        ack: jest.fn()
      };

      const messageHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler(mockMessage);

      expect(mockMessage.ack).toHaveBeenCalled();
    });

    it('should handle non-JSON-RPC messages', () => {
      const mockMessage = {
        data: Buffer.from(JSON.stringify({ type: 'other' })).toString('base64'),
        ack: jest.fn()
      };

      const messageHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'message')[1];
      messageHandler(mockMessage);

      expect(mockMessage.ack).toHaveBeenCalled();
    });
  });

  describe('waitForResponse', () => {
    it('should resolve when response is received', async () => {
      const requestId = 'test-wait-id';
      const response = { result: 'test response' };

      const promise = agentCommunicator.waitForResponse(requestId, 1000);

      // Simulate response
      setTimeout(() => {
        const pendingRequest = agentCommunicator.pendingRequests.get(requestId);
        if (pendingRequest) {
          pendingRequest.resolve(response);
        }
      }, 100);

      const result = await promise;
      expect(result).toEqual(response);
    });

    it('should reject on timeout', async () => {
      const requestId = 'test-timeout-id';

      await expect(agentCommunicator.waitForResponse(requestId, 100))
        .rejects.toThrow('Request timeout after 100ms');
    });

    it('should reject when explicitly rejected', async () => {
      const requestId = 'test-reject-id';
      const error = new Error('Test error');

      const promise = agentCommunicator.waitForResponse(requestId, 1000);

      setTimeout(() => {
        const pendingRequest = agentCommunicator.pendingRequests.get(requestId);
        if (pendingRequest) {
          pendingRequest.reject(error);
        }
      }, 100);

      await expect(promise).rejects.toThrow('Test error');
    });
  });

  describe('cleanup', () => {
    it('should reject all pending requests', () => {
      const requestId1 = 'test-cleanup-1';
      const requestId2 = 'test-cleanup-2';

      // Add pending requests
      agentCommunicator.pendingRequests.set(requestId1, {
        resolve: jest.fn(),
        reject: jest.fn()
      });
      agentCommunicator.pendingRequests.set(requestId2, {
        resolve: jest.fn(),
        reject: jest.fn()
      });

      agentCommunicator.cleanup();

      expect(agentCommunicator.pendingRequests.size).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple concurrent requests', async () => {
      const { v4: uuidv4 } = require('uuid');
      
      // Mock different request IDs
      uuidv4
        .mockReturnValueOnce('request-1')
        .mockReturnValueOnce('request-2');

      const responses = [
        { result: { response: 'Response 1' } },
        { result: { response: 'Response 2' } }
      ];

      const promises = [
        agentCommunicator.sendToAgent('booking', 'Book flight', {}),
        agentCommunicator.sendToAgent('planning', 'Plan trip', {})
      ];

      // Resolve requests in order
      setTimeout(() => {
        const pendingRequest1 = agentCommunicator.pendingRequests.get('request-1');
        if (pendingRequest1) pendingRequest1.resolve(responses[0]);
      }, 50);

      setTimeout(() => {
        const pendingRequest2 = agentCommunicator.pendingRequests.get('request-2');
        if (pendingRequest2) pendingRequest2.resolve(responses[1]);
      }, 100);

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0].response).toBe('Response 1');
      expect(results[1].response).toBe('Response 2');
    });
  });
}); 