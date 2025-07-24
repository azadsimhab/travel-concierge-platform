// src/orchestrator/config.js
require('dotenv').config();

module.exports = {
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || 'your-gcp-project-id',
  GCP_LOCATION: process.env.GCP_LOCATION || 'us-central1',
  PUBSUB_USER_REQUESTS_SUB: process.env.PUBSUB_USER_REQUESTS_SUB || 'user-requests-sub',
  PUBSUB_AGENT_RESPONSES_TOPIC: process.env.PUBSUB_AGENT_RESPONSES_TOPIC || 'agent-responses',
  PUBSUB_AGENT_RESPONSES_SUB: process.env.PUBSUB_AGENT_RESPONSES_SUB || 'orchestrator-responses',
  FIRESTORE_SESSIONS_COLLECTION: process.env.FIRESTORE_SESSIONS_COLLECTION || 'sessions',
  GEMINI_MODEL_ID: process.env.GEMINI_MODEL_ID || 'gemini-2-ultra',
  AGENT_REQUEST_TIMEOUT_MS: parseInt(process.env.AGENT_REQUEST_TIMEOUT_MS) || 30000,
  
  // WebSocket Configuration
  WEBSOCKET_PORT: parseInt(process.env.WEBSOCKET_PORT) || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Add more config as needed
}; 