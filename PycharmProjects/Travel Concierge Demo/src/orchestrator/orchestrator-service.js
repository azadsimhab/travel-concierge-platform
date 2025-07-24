// src/orchestrator/orchestrator-service.js
require('dotenv').config();
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const config = require('./config');
const SessionManager = require('./session-manager');
const IntentAnalyzer = require('./intent-analyzer');
const AgentCommunicator = require('./agent-communicator');
const WebSocketGateway = require('./websocket-gateway');
const logger = require('./logger');

// Initialize GCP clients
const pubsub = new PubSub({ projectId: config.GCP_PROJECT_ID });
const firestore = new Firestore({ projectId: config.GCP_PROJECT_ID });

const sessionManager = new SessionManager(firestore, config);
const intentAnalyzer = new IntentAnalyzer(config);
const agentCommunicator = new AgentCommunicator(pubsub, config);
const wsGateway = new WebSocketGateway(config);

async function handleUserRequest(message) {
  try {
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    logger.info('Received user request', { data });
    const { sessionId, userInput, userId } = data;
    
    // Send typing indicator to user
    await wsGateway.sendTypingIndicator(userId, true);
    
    // Retrieve or create session context
    const sessionContext = await sessionManager.getSessionContext(sessionId, userId);
    
    // Analyze intent
    const intent = await intentAnalyzer.analyze(userInput, sessionContext);
    logger.info('Intent analyzed', { intent, userInput });
    
    // Route to appropriate agent
    const agentResponse = await agentCommunicator.sendToAgent(intent, userInput, sessionContext);
    
    // Update session context
    await sessionManager.updateSessionContext(sessionId, agentResponse.context);
    
    // Stop typing indicator
    await wsGateway.sendTypingIndicator(userId, false);
    
    // Send response to user via WebSocket
    const messageSent = await wsGateway.sendMessage(userId, agentResponse.response);
    
    if (!messageSent) {
      logger.warn('User not connected, response not delivered', { userId });
    }
    
    logger.info('Successfully processed user request', { sessionId, intent, messageSent });
  } catch (err) {
    logger.error('Error handling user request', { error: err });
    // Optionally send error to user
  }
}

async function start() {
  try {
    logger.info('Starting Orchestrator Service...');
    
    // Start WebSocket Gateway
    await wsGateway.start();
    logger.info('WebSocket Gateway started successfully');
    
    // Initialize Pub/Sub subscription
    const subscription = pubsub.subscription(config.PUBSUB_USER_REQUESTS_SUB);
    
    subscription.on('message', async (message) => {
      await handleUserRequest(message);
      message.ack();
    });
    
    subscription.on('error', (err) => {
      logger.error('Pub/Sub subscription error', { error: err });
    });
    
    logger.info('Orchestrator Service started and listening for user requests.');
    
    // Graceful shutdown handling
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start Orchestrator Service:', error);
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Received shutdown signal, starting graceful shutdown...');
  
  try {
    // Clean up agent communicator
    agentCommunicator.cleanup();
    logger.info('Agent communicator cleaned up');
    
    // Shutdown WebSocket Gateway
    await wsGateway.shutdown();
    logger.info('WebSocket Gateway shutdown complete');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

start(); 