# Production-ready Dockerfile for Orchestrator Service
# Multi-stage build for optimized image size and security

# =============================================================================
# BUILDER STAGE
# =============================================================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY config/ ./config/
COPY terraform/ ./terraform/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# =============================================================================
# PRODUCTION STAGE
# =============================================================================
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY yarn.lock* ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/temp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the WebSocket port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Set the default command
CMD ["dumb-init", "node", "src/orchestrator/orchestrator-service.js"]

# =============================================================================
# DEVELOPMENT STAGE (Optional)
# =============================================================================
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install development dependencies
COPY package*.json ./
COPY yarn.lock* ./
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 9229

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001
ENV HOST=0.0.0.0

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Default command for development
CMD ["npm", "run", "dev"] 