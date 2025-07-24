// src/orchestrator/__tests__/jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/orchestrator/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/orchestrator/**/*.js',
    '!src/orchestrator/**/*.test.js',
    '!src/orchestrator/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/orchestrator/__tests__/setup.js'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
}; 