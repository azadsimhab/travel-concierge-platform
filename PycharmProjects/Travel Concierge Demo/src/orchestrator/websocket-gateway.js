// src/orchestrator/websocket-gateway.js
const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class WebSocketGateway {
  constructor(config) {
    this.config = config;
    this.port = config.WEBSOCKET_PORT || 3001;
    this.jwtSecret = config.JWT_SECRET || 'your-jwt-secret';
    
    // User connection mapping: userId -> socketId
    this.userConnections = new Map();
    // Socket mapping: socketId -> userId
    this.socketUsers = new Map();
    
    // Create HTTP server for Socket.IO
    this.httpServer = http.createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: config.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    this.initializeSocketHandlers();
  }

  async start() {
    try {
      this.httpServer.listen(this.port, () => {
        logger.info(`WebSocket Gateway started on port ${this.port}`);
      });
    } catch (error) {
      logger.error('Failed to start WebSocket Gateway:', error);
      throw error;
    }
  }

  initializeSocketHandlers() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          logger.warn('Connection attempt without token', { socketId: socket.id });
          return next(new Error('Authentication required'));
        }
        
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(cleanToken, this.jwtSecret);
        socket.userId = decoded.userId;
        socket.userData = decoded;
        
        logger.info('Socket authenticated', { 
          socketId: socket.id, 
          userId: socket.userId 
        });
        
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        return next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Disconnect handler
    this.io.on('disconnect', (socket) => {
      this.handleDisconnection(socket);
    });
  }

  handleConnection(socket) {
    const { userId } = socket;
    
    try {
      // Store connection mappings
      this.userConnections.set(userId, socket.id);
      this.socketUsers.set(socket.id, userId);
      
      // Join user to their personal room
      socket.join(`user:${userId}`);
      
      // Join user to general room for broadcast messages
      socket.join('general');
      
      logger.info('User connected', { 
        socketId: socket.id, 
        userId: userId,
        totalConnections: this.io.engine.clientsCount 
      });
      
      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Travel Concierge',
        userId: userId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error('Error handling socket connection:', error);
      socket.disconnect();
    }
  }

  handleDisconnection(socket) {
    const { userId } = socket;
    
    try {
      // Clean up connection mappings
      this.userConnections.delete(userId);
      this.socketUsers.delete(socket.id);
      
      logger.info('User disconnected', { 
        socketId: socket.id, 
        userId: userId,
        totalConnections: this.io.engine.clientsCount 
      });
      
    } catch (error) {
      logger.error('Error handling socket disconnection:', error);
    }
  }

  async sendMessage(userId, message) {
    try {
      const socketId = this.userConnections.get(userId);
      
      if (!socketId) {
        logger.warn('User not connected, message not delivered', { userId });
        return false;
      }
      
      const socket = this.io.sockets.sockets.get(socketId);
      
      if (!socket) {
        logger.warn('Socket not found, cleaning up stale connection', { userId, socketId });
        this.userConnections.delete(userId);
        return false;
      }
      
      // Send message to specific user
      socket.emit('message', {
        message: message,
        timestamp: Date.now(),
        type: 'response'
      });
      
      logger.info('Message sent to user', { userId, socketId, messageLength: message.length });
      return true;
      
    } catch (error) {
      logger.error('Error sending message to user:', error);
      return false;
    }
  }

  async broadcastMessage(message, room = 'general') {
    try {
      this.io.to(room).emit('broadcast', {
        message: message,
        timestamp: Date.now(),
        type: 'broadcast'
      });
      
      logger.info('Broadcast message sent', { room, messageLength: message.length });
      return true;
      
    } catch (error) {
      logger.error('Error broadcasting message:', error);
      return false;
    }
  }

  async sendTypingIndicator(userId, isTyping = true) {
    try {
      const socketId = this.userConnections.get(userId);
      
      if (socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('typing', { isTyping, timestamp: Date.now() });
        }
      }
      
    } catch (error) {
      logger.error('Error sending typing indicator:', error);
    }
  }

  getConnectedUsers() {
    return Array.from(this.userConnections.keys());
  }

  getConnectionCount() {
    return this.io.engine.clientsCount;
  }

  isUserConnected(userId) {
    return this.userConnections.has(userId);
  }

  // Graceful shutdown
  async shutdown() {
    try {
      logger.info('Shutting down WebSocket Gateway...');
      
      // Disconnect all clients
      this.io.sockets.sockets.forEach((socket) => {
        socket.disconnect(true);
      });
      
      // Close server
      this.httpServer.close(() => {
        logger.info('WebSocket Gateway shutdown complete');
      });
      
    } catch (error) {
      logger.error('Error during WebSocket Gateway shutdown:', error);
    }
  }

  // Health check method
  getHealthStatus() {
    return {
      status: 'healthy',
      port: this.port,
      connectedUsers: this.getConnectedUsers().length,
      totalConnections: this.getConnectionCount(),
      uptime: process.uptime()
    };
  }
}

module.exports = WebSocketGateway; 