// src/orchestrator/__tests__/setup.js

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.GCP_PROJECT_ID = 'test-project';
  process.env.GEMINI_MODEL_ID = 'gemini-2-ultra-test';
  process.env.WEBSOCKET_PORT = '3001';
  process.env.JWT_SECRET = 'test-jwt-secret';
});

// Global test cleanup
afterAll(() => {
  // Clean up any global test state
});

// Suppress console.log during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Optionally suppress console output during tests
  // console.log = jest.fn();
  // console.error = jest.fn();
});

afterEach(() => {
  // Restore console functions
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  createMockMessage: (data) => ({
    data: Buffer.from(JSON.stringify(data)).toString('base64'),
    ack: jest.fn()
  }),
  
  createMockSessionContext: (userId = 'test-user') => ({
    userId,
    createdAt: Date.now(),
    history: []
  }),
  
  createMockUserInput: (text = 'Test input') => text,
  
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
}; 