/**
 * Integration tests for Orchestrator Service
 * Tests the complete request processing flow with mocked external services
 */

const { OrchestratorService } = require('../orchestrator-service');
const { SessionManager } = require('../session-manager');
const { IntentAnalyzer } = require('../intent-analyzer');
const { AgentCommunicator } = require('../agent-communicator');
const { WebSocketGateway } = require('../websocket-gateway');
const { logger } = require('../logger');

// Mock external services
jest.mock('@google-cloud/pubsub');
jest.mock('@google-cloud/firestore');
jest.mock('@google-cloud/aiplatform');

// Mock internal modules
jest.mock('../session-manager');
jest.mock('../intent-analyzer');
jest.mock('../agent-communicator');
jest.mock('../websocket-gateway');
jest.mock('../logger');

describe('OrchestratorService Integration Tests', () => {
  let orchestratorService;
  let mockSessionManager;
  let mockIntentAnalyzer;
  let mockAgentCommunicator;
  let mockWebSocketGateway;
  let mockPubSub;
  let mockFirestore;
  let mockVertexAI;

  const mockConfig = {
    projectId: 'test-project',
    region: 'us-central1',
    pubsub: {
      requestTopic: 'travel-requests',
      responseTopic: 'travel-responses',
      subscriptionName: 'orchestrator-subscription'
    },
    firestore: {
      collectionName: 'sessions'
    },
    vertexAI: {
      modelName: 'gemini-2.0-ultra',
      endpoint: 'projects/test-project/locations/us-central1/endpoints/test-endpoint'
    },
    websocket: {
      port: 8080,
      cors: {
        origin: ['http://localhost:3000'],
        credentials: true
      }
    }
  };

  const mockUserRequest = {
    userId: 'user-123',
    sessionId: 'session-456',
    message: 'I want to plan a trip to Paris for next month',
    timestamp: new Date().toISOString(),
    metadata: {
      userAgent: 'Mozilla/5.0',
      ipAddress: '192.168.1.1'
    }
  };

  const mockIntentResult = {
    intent: 'trip_planning',
    confidence: 0.95,
    entities: {
      destination: 'Paris',
      timeframe: 'next month'
    },
    suggestedAgent: 'planning'
  };

  const mockAgentResponse = {
    requestId: 'req-789',
    agentId: 'planning',
    response: {
      message: 'I\'d be happy to help you plan your trip to Paris! Let me gather some information about your preferences.',
      suggestions: [
        'What type of accommodation do you prefer?',
        'What\'s your budget range?',
        'Any specific activities you\'re interested in?'
      ],
      nextSteps: ['collect_preferences', 'search_accommodations']
    },
    metadata: {
      processingTime: 1200,
      tokensUsed: 150
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup external service mocks
    mockPubSub = {
      Topic: jest.fn().mockReturnValue({
        publish: jest.fn().mockResolvedValue(['message-id-123']),
        subscription: jest.fn().mockReturnValue({
          on: jest.fn(),
          close: jest.fn()
        })
      }),
      Subscription: jest.fn().mockReturnValue({
        on: jest.fn(),
        close: jest.fn()
      })
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              userId: 'user-123',
              sessionId: 'session-456',
              context: {
                previousMessages: [],
                userPreferences: {},
                currentStep: 'initial'
              },
              lastUpdated: new Date().toISOString()
            })
          }),
          set: jest.fn().mockResolvedValue(),
          update: jest.fn().mockResolvedValue()
        })
      })
    };

    mockVertexAI = {
      PredictionServiceClient: jest.fn().mockReturnValue({
        predict: jest.fn().mockResolvedValue({
          predictions: [{
            instances: [{
              content: 'I want to plan a trip to Paris for next month'
            }],
            predictions: [{
              content: JSON.stringify(mockIntentResult)
            }]
          }]
        })
      })
    };

    // Setup internal module mocks
    mockSessionManager = {
      getSession: jest.fn().mockResolvedValue({
        userId: 'user-123',
        sessionId: 'session-456',
        context: {
          previousMessages: [],
          userPreferences: {},
          currentStep: 'initial'
        }
      }),
      updateSession: jest.fn().mockResolvedValue(),
      createSession: jest.fn().mockResolvedValue({
        sessionId: 'session-456',
        userId: 'user-123'
      }),
      addMessageToSession: jest.fn().mockResolvedValue()
    };

    mockIntentAnalyzer = {
      analyzeIntent: jest.fn().mockResolvedValue(mockIntentResult),
      extractEntities: jest.fn().mockResolvedValue({
        destination: 'Paris',
        timeframe: 'next month'
      })
    };

    mockAgentCommunicator = {
      sendRequest: jest.fn().mockResolvedValue(mockAgentResponse),
      waitForResponse: jest.fn().mockResolvedValue(mockAgentResponse),
      publishRequest: jest.fn().mockResolvedValue(),
      subscribeToResponses: jest.fn().mockResolvedValue()
    };

    mockWebSocketGateway = {
      sendMessage: jest.fn().mockResolvedValue(),
      sendTypingIndicator: jest.fn().mockResolvedValue(),
      broadcastMessage: jest.fn().mockResolvedValue(),
      getConnectedUsers: jest.fn().mockReturnValue(['user-123']),
      isUserConnected: jest.fn().mockReturnValue(true)
    };

    // Mock logger
    logger.info = jest.fn();
    logger.error = jest.fn();
    logger.warn = jest.fn();
    logger.debug = jest.fn();

    // Create orchestrator service instance
    orchestratorService = new OrchestratorService(mockConfig);

    // Inject mocked dependencies
    orchestratorService.sessionManager = mockSessionManager;
    orchestratorService.intentAnalyzer = mockIntentAnalyzer;
    orchestratorService.agentCommunicator = mockAgentCommunicator;
    orchestratorService.websocketGateway = mockWebSocketGateway;
  });

  describe('Request Processing Flow', () => {
    test('should process a complete user request successfully', async () => {
      // Arrange
      const request = { ...mockUserRequest };

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toEqual(mockAgentResponse.response);
      expect(result.sessionId).toBe('session-456');

      // Verify session management
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('user-123', 'session-456');
      expect(mockSessionManager.addMessageToSession).toHaveBeenCalledWith(
        'session-456',
        expect.objectContaining({
          type: 'user',
          content: request.message,
          timestamp: expect.any(String)
        })
      );

      // Verify intent analysis
      expect(mockIntentAnalyzer.analyzeIntent).toHaveBeenCalledWith(
        request.message,
        expect.objectContaining({
          previousMessages: [],
          userPreferences: {},
          currentStep: 'initial'
        })
      );

      // Verify agent communication
      expect(mockAgentCommunicator.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'planning',
          message: request.message,
          intent: mockIntentResult,
          sessionContext: expect.any(Object)
        })
      );

      // Verify WebSocket messaging
      expect(mockWebSocketGateway.sendTypingIndicator).toHaveBeenCalledWith('user-123', true);
      expect(mockWebSocketGateway.sendMessage).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          type: 'response',
          content: mockAgentResponse.response.message,
          suggestions: mockAgentResponse.response.suggestions
        })
      );
      expect(mockWebSocketGateway.sendTypingIndicator).toHaveBeenCalledWith('user-123', false);
    });

    test('should handle new user session creation', async () => {
      // Arrange
      const newUserRequest = {
        ...mockUserRequest,
        sessionId: null
      };

      mockSessionManager.getSession.mockRejectedValue(new Error('Session not found'));
      mockSessionManager.createSession.mockResolvedValue({
        sessionId: 'new-session-789',
        userId: 'user-123'
      });

      // Act
      const result = await orchestratorService.processUserRequest(newUserRequest);

      // Assert
      expect(result.sessionId).toBe('new-session-789');
      expect(mockSessionManager.createSession).toHaveBeenCalledWith('user-123');
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('user-123', null);
    });

    test('should handle intent analysis failure gracefully', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockIntentAnalyzer.analyzeIntent.mockRejectedValue(new Error('Intent analysis failed'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Intent analysis failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Intent analysis failed',
        expect.objectContaining({
          error: expect.any(Error),
          userId: 'user-123',
          sessionId: 'session-456'
        })
      );
    });

    test('should handle agent communication timeout', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockAgentCommunicator.sendRequest.mockRejectedValue(new Error('Request timeout'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent communication failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Agent communication failed',
        expect.objectContaining({
          error: expect.any(Error),
          agentId: 'planning',
          userId: 'user-123'
        })
      );
    });

    test('should handle WebSocket connection failure', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockWebSocketGateway.isUserConnected.mockReturnValue(false);
      mockWebSocketGateway.sendMessage.mockRejectedValue(new Error('WebSocket error'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(true); // Main flow should still succeed
      expect(logger.warn).toHaveBeenCalledWith(
        'User not connected to WebSocket',
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('Session Management Integration', () => {
    test('should maintain session context across requests', async () => {
      // Arrange
      const firstRequest = { ...mockUserRequest };
      const secondRequest = {
        ...mockUserRequest,
        message: 'I prefer hotels under $200 per night'
      };

      // Act
      await orchestratorService.processUserRequest(firstRequest);
      await orchestratorService.processUserRequest(secondRequest);

      // Assert
      expect(mockSessionManager.getSession).toHaveBeenCalledTimes(2);
      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        'session-456',
        expect.objectContaining({
          context: expect.objectContaining({
            currentStep: expect.any(String)
          })
        })
      );
    });

    test('should handle session expiration', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockSessionManager.getSession.mockRejectedValue(new Error('Session expired'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(mockSessionManager.createSession).toHaveBeenCalledWith('user-123');
      expect(result.sessionId).toBeDefined();
    });
  });

  describe('Intent Analysis Integration', () => {
    test('should route to correct agent based on intent', async () => {
      // Arrange
      const bookingRequest = {
        ...mockUserRequest,
        message: 'I want to book a flight from New York to London'
      };

      const bookingIntent = {
        intent: 'flight_booking',
        confidence: 0.92,
        entities: {
          origin: 'New York',
          destination: 'London'
        },
        suggestedAgent: 'booking'
      };

      mockIntentAnalyzer.analyzeIntent.mockResolvedValue(bookingIntent);

      // Act
      await orchestratorService.processUserRequest(bookingRequest);

      // Assert
      expect(mockAgentCommunicator.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'booking',
          intent: bookingIntent
        })
      );
    });

    test('should handle low confidence intents', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      const lowConfidenceIntent = {
        ...mockIntentResult,
        confidence: 0.3
      };

      mockIntentAnalyzer.analyzeIntent.mockResolvedValue(lowConfidenceIntent);

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Low confidence intent detected',
        expect.objectContaining({
          confidence: 0.3,
          intent: 'trip_planning'
        })
      );
    });
  });

  describe('Agent Communication Integration', () => {
    test('should handle multiple agent responses', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      const multiAgentResponse = {
        ...mockAgentResponse,
        responses: [
          {
            agentId: 'planning',
            response: { message: 'Planning response' }
          },
          {
            agentId: 'booking',
            response: { message: 'Booking response' }
          }
        ]
      };

      mockAgentCommunicator.sendRequest.mockResolvedValue(multiAgentResponse);

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.response).toBeDefined();
      expect(mockWebSocketGateway.sendMessage).toHaveBeenCalledTimes(1);
    });

    test('should handle agent response with follow-up actions', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      const responseWithActions = {
        ...mockAgentResponse,
        response: {
          ...mockAgentResponse.response,
          actions: [
            { type: 'search_hotels', params: { destination: 'Paris' } },
            { type: 'send_notification', params: { message: 'Search completed' } }
          ]
        }
      };

      mockAgentCommunicator.sendRequest.mockResolvedValue(responseWithActions);

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.actions).toBeDefined();
      expect(result.actions).toHaveLength(2);
    });
  });

  describe('WebSocket Integration', () => {
    test('should send typing indicators during processing', async () => {
      // Arrange
      const request = { ...mockUserRequest };

      // Act
      await orchestratorService.processUserRequest(request);

      // Assert
      expect(mockWebSocketGateway.sendTypingIndicator).toHaveBeenCalledWith('user-123', true);
      expect(mockWebSocketGateway.sendTypingIndicator).toHaveBeenCalledWith('user-123', false);
    });

    test('should handle user disconnection during processing', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockWebSocketGateway.isUserConnected.mockReturnValue(false);

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockWebSocketGateway.sendMessage).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'User not connected to WebSocket',
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    test('should broadcast system messages to all connected users', async () => {
      // Arrange
      const systemMessage = {
        type: 'system',
        content: 'System maintenance in 5 minutes',
        priority: 'high'
      };

      // Act
      await orchestratorService.broadcastSystemMessage(systemMessage);

      // Assert
      expect(mockWebSocketGateway.broadcastMessage).toHaveBeenCalledWith(systemMessage);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle Firestore connection errors', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockSessionManager.getSession.mockRejectedValue(new Error('Firestore connection failed'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session management failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Session management failed',
        expect.objectContaining({
          error: expect.any(Error),
          userId: 'user-123'
        })
      );
    });

    test('should handle Pub/Sub publishing errors', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockAgentCommunicator.sendRequest.mockRejectedValue(new Error('Pub/Sub publishing failed'));

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Agent communication failed',
        expect.objectContaining({
          error: expect.any(Error)
        })
      );
    });

    test('should retry failed operations with exponential backoff', async () => {
      // Arrange
      const request = { ...mockUserRequest };
      mockIntentAnalyzer.analyzeIntent
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockIntentResult);

      // Act
      const result = await orchestratorService.processUserRequest(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockIntentAnalyzer.analyzeIntent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Monitoring', () => {
    test('should log performance metrics', async () => {
      // Arrange
      const request = { ...mockUserRequest };

      // Act
      await orchestratorService.processUserRequest(request);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Request processed successfully',
        expect.objectContaining({
          userId: 'user-123',
          sessionId: 'session-456',
          processingTime: expect.any(Number),
          intent: 'trip_planning',
          agentId: 'planning'
        })
      );
    });

    test('should handle high load scenarios', async () => {
      // Arrange
      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...mockUserRequest,
        userId: `user-${i}`,
        sessionId: `session-${i}`
      }));

      // Act
      const results = await Promise.all(
        requests.map(req => orchestratorService.processUserRequest(req))
      );

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Service Lifecycle', () => {
    test('should initialize all components on startup', async () => {
      // Act
      await orchestratorService.initialize();

      // Assert
      expect(mockSessionManager.initialize).toHaveBeenCalled();
      expect(mockIntentAnalyzer.initialize).toHaveBeenCalled();
      expect(mockAgentCommunicator.initialize).toHaveBeenCalled();
      expect(mockWebSocketGateway.initialize).toHaveBeenCalled();
    });

    test('should gracefully shutdown all components', async () => {
      // Act
      await orchestratorService.shutdown();

      // Assert
      expect(mockSessionManager.shutdown).toHaveBeenCalled();
      expect(mockIntentAnalyzer.shutdown).toHaveBeenCalled();
      expect(mockAgentCommunicator.shutdown).toHaveBeenCalled();
      expect(mockWebSocketGateway.shutdown).toHaveBeenCalled();
    });
  });
}); 