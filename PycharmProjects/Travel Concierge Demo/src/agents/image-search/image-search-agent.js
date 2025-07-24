const AgentBase = require('../core/agent-base');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');
const logger = require('../../shared/utils/logger');
const ImageProcessor = require('./image-processor');
const DestinationMatcher = require('./destination-matcher');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ImageSearchAgent extends AgentBase {
  constructor(config) {
    super('image-search', config);
    this.storage = new Storage();
    this.pubsub = new PubSub();
    this.bucketName = config.imageBucketName;
    this.imageProcessor = new ImageProcessor(config);
    this.destinationMatcher = new DestinationMatcher(config);
    this.imageSearchTopic = config.imageSearchTopic;
  }

  /**
   * Handles image search requests from orchestrator or API.
   * @param {Object} data - { sessionId, userId, imageBuffer, imageName, context }
   */
  async processMessage(data) {
    const { sessionId, userId, imageBuffer, imageName, context } = data.payload;
    try {
      // 1. Validate and preprocess image
      const processedImage = await this.imageProcessor.preprocessImage(imageBuffer, imageName);
      if (!processedImage) throw new Error('Invalid or unsupported image');

      // 2. Upload to GCS
      const gcsPath = await this.uploadToGCS(processedImage, imageName, userId);

      // 3. Publish async event for embedding & matching
      const requestId = uuidv4();
      await this.pubsub.topic(this.imageSearchTopic).publishJSON({
        gcsPath,
        sessionId,
        userId,
        requestId,
        context,
        timestamp: Date.now()
      });

      // 4. Respond to orchestrator (acknowledge async processing)
      await this.sendMessage('orchestrator', {
        action: 'image_search_ack',
        sessionId,
        userId,
        requestId,
        status: 'processing',
        agent: 'image-search',
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('ImageSearchAgent error:', error);
      await this.sendMessage('orchestrator', {
        action: 'image_search_error',
        sessionId,
        userId,
        error: error.message,
        agent: 'image-search',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Uploads a processed image to GCS securely.
   */
  async uploadToGCS(imageBuffer, imageName, userId) {
    const fileId = uuidv4();
    const safeName = path.basename(imageName).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const gcsPath = `uploads/${userId || 'anon'}/${fileId}-${safeName}`;
    const file = this.storage.bucket(this.bucketName).file(gcsPath);
    await file.save(imageBuffer, {
      resumable: false,
      contentType: 'image/jpeg',
      metadata: {
        cacheControl: 'private, max-age=3600',
        metadata: { uploadedBy: userId || 'anonymous' }
      }
    });
    return gcsPath;
  }
}

module.exports = ImageSearchAgent; 