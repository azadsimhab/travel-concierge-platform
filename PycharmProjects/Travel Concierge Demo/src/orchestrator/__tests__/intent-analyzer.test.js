// src/orchestrator/__tests__/intent-analyzer.test.js
const IntentAnalyzer = require('../intent-analyzer');

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => {
  const mockModel = {
    generateContent: jest.fn(),
  };
  
  const mockVertexAI = {
    getGenerativeModel: jest.fn().mockReturnValue(mockModel),
  };
  
  return { VertexAI: jest.fn().mockImplementation(() => mockVertexAI) };
});

describe('IntentAnalyzer', () => {
  let intentAnalyzer;
  let mockVertexAI;
  let mockModel;
  let config;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup config
    config = {
      GEMINI_MODEL_ID: 'gemini-2-ultra',
      GCP_PROJECT_ID: 'test-project',
      GCP_LOCATION: 'us-central1'
    };
    
    // Get mocked Vertex AI instance
    const { VertexAI } = require('@google-cloud/vertexai');
    mockVertexAI = new VertexAI();
    mockModel = mockVertexAI.getGenerativeModel();
    
    // Create IntentAnalyzer instance
    intentAnalyzer = new IntentAnalyzer(config);
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(intentAnalyzer.modelId).toBe('gemini-2-ultra');
      expect(intentAnalyzer.projectId).toBe('test-project');
      expect(intentAnalyzer.location).toBe('us-central1');
      expect(intentAnalyzer.vertexAI).toBe(mockVertexAI);
      expect(intentAnalyzer.model).toBe(mockModel);
    });

    it('should use default location when not provided', () => {
      const configWithoutLocation = {
        GEMINI_MODEL_ID: 'gemini-2-ultra',
        GCP_PROJECT_ID: 'test-project'
      };
      
      const analyzer = new IntentAnalyzer(configWithoutLocation);
      expect(analyzer.location).toBe('us-central1');
    });
  });

  describe('analyze', () => {
    const userInput = 'I want to book a flight to Paris';
    const sessionContext = {
      userId: 'user-123',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help you?' }
      ]
    };

    it('should analyze intent using Gemini successfully', async () => {
      // Mock successful Gemini response
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'booking' }]
            }
          }]
        }
      });

      const result = await intentAnalyzer.analyze(userInput, sessionContext);

      expect(mockModel.generateContent).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: expect.stringContaining(userInput) }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        },
      });
      expect(result).toBe('booking');
    });

    it('should fallback to keyword detection when Gemini fails', async () => {
      // Mock Gemini failure
      mockModel.generateContent.mockRejectedValue(new Error('Gemini API error'));

      const result = await intentAnalyzer.analyze(userInput, sessionContext);

      expect(result).toBe('booking'); // Should detect 'book' keyword
    });

    it('should handle various intent types correctly', async () => {
      const testCases = [
        { input: 'Plan my trip to Tokyo', expected: 'planning' },
        { input: 'Give me travel inspiration', expected: 'inspiration' },
        { input: 'Check my trip status', expected: 'trip-monitor' },
        { input: 'I need help right now', expected: 'day-of' },
        { input: 'Hello there', expected: 'general' }
      ];

      for (const testCase of testCases) {
        mockModel.generateContent.mockRejectedValue(new Error('Gemini error'));
        
        const result = await intentAnalyzer.analyze(testCase.input, sessionContext);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should handle empty session context', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: 'general' }]
            }
          }]
        }
      });

      const result = await intentAnalyzer.analyze(userInput, {});
      expect(result).toBe('general');
    });
  });

  describe('buildIntentAnalysisPrompt', () => {
    it('should build prompt with user input and session context', () => {
      const userInput = 'Book a hotel in London';
      const sessionContext = {
        userId: 'user-456',
        history: [
          { role: 'user', content: 'I need accommodation' },
          { role: 'assistant', content: 'I can help with that!' }
        ]
      };

      const prompt = intentAnalyzer.buildIntentAnalysisPrompt(userInput, sessionContext);

      expect(prompt).toContain(userInput);
      expect(prompt).toContain('user: I need accommodation');
      expect(prompt).toContain('assistant: I can help with that!');
      expect(prompt).toContain('booking: User wants to book flights, hotels, activities');
      expect(prompt).toContain('planning: User wants to plan an itinerary');
    });

    it('should handle session context without history', () => {
      const userInput = 'Hello';
      const sessionContext = { userId: 'user-123' };

      const prompt = intentAnalyzer.buildIntentAnalysisPrompt(userInput, sessionContext);

      expect(prompt).toContain('No recent history');
      expect(prompt).toContain(userInput);
    });

    it('should limit history to last 5 messages', () => {
      const userInput = 'Test input';
      const sessionContext = {
        userId: 'user-123',
        history: [
          { role: 'user', content: 'Message 1' },
          { role: 'assistant', content: 'Response 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'assistant', content: 'Response 2' },
          { role: 'user', content: 'Message 3' },
          { role: 'assistant', content: 'Response 3' },
          { role: 'user', content: 'Message 4' },
          { role: 'assistant', content: 'Response 4' },
          { role: 'user', content: 'Message 5' },
          { role: 'assistant', content: 'Response 5' },
          { role: 'user', content: 'Message 6' }, // Should be excluded
        ]
      };

      const prompt = intentAnalyzer.buildIntentAnalysisPrompt(userInput, sessionContext);

      expect(prompt).toContain('Message 6'); // Should include the last 5 messages
      expect(prompt).not.toContain('Message 1'); // Should exclude older messages
    });
  });

  describe('parseIntentFromResponse', () => {
    it('should parse valid intent from response', () => {
      const testCases = [
        { response: 'booking', expected: 'booking' },
        { response: 'The intent is planning', expected: 'planning' },
        { response: 'INSPIRATION', expected: 'inspiration' },
        { response: 'trip-monitor intent detected', expected: 'trip-monitor' },
        { response: 'day-of', expected: 'day-of' },
        { response: 'general intent', expected: 'general' }
      ];

      for (const testCase of testCases) {
        const result = intentAnalyzer.parseIntentFromResponse(testCase.response);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should return general for unrecognized intents', () => {
      const result = intentAnalyzer.parseIntentFromResponse('unknown intent');
      expect(result).toBe('general');
    });

    it('should handle case insensitive parsing', () => {
      const result = intentAnalyzer.parseIntentFromResponse('BOOKING');
      expect(result).toBe('booking');
    });
  });

  describe('fallbackIntentDetection', () => {
    it('should detect booking intent', () => {
      const testCases = [
        'I want to book a flight',
        'Reserve a hotel room',
        'Book an activity',
        'Make a reservation'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('booking');
      }
    });

    it('should detect planning intent', () => {
      const testCases = [
        'Plan my itinerary',
        'Create a schedule',
        'Plan my trip'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('planning');
      }
    });

    it('should detect inspiration intent', () => {
      const testCases = [
        'Give me travel inspiration',
        'Recommend destinations',
        'Travel suggestions',
        'Travel ideas'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('inspiration');
      }
    });

    it('should detect trip-monitor intent', () => {
      const testCases = [
        'Check my trip status',
        'Monitor my journey',
        'Get updates',
        'Track my trip'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('trip-monitor');
      }
    });

    it('should detect day-of intent', () => {
      const testCases = [
        'I need help right now',
        'Current assistance',
        'Day of support',
        'Help me now'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('day-of');
      }
    });

    it('should return general for unrecognized inputs', () => {
      const testCases = [
        'Hello',
        'How are you?',
        'Thank you',
        'Goodbye'
      ];

      for (const input of testCases) {
        const result = intentAnalyzer.fallbackIntentDetection(input);
        expect(result).toBe('general');
      }
    });
  });
}); 