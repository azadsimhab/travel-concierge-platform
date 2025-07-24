const sharp = require('sharp');
const crypto = require('crypto');
const logger = require('../../shared/utils/logger');

class ImageProcessor {
  constructor(config) {
    this.maxSizeBytes = config.maxImageSizeBytes || 5 * 1024 * 1024; // 5MB
    this.maxWidth = config.maxImageWidth || 1024;
    this.maxHeight = config.maxImageHeight || 1024;
    this.embeddingCache = new Map(); // In-memory cache; replace with Redis for prod
    this.vertexAI = config.vertexAI; // Injected VertexAI client
  }

  /**
   * Validates and preprocesses an image buffer.
   * Returns processed JPEG buffer or throws error.
   */
  async preprocessImage(imageBuffer, imageName) {
    try {
      if (!imageBuffer || imageBuffer.length > this.maxSizeBytes) {
        throw new Error('Image too large or missing');
      }
      // Validate and convert to JPEG, resize, strip metadata
      const processed = await sharp(imageBuffer)
        .resize(this.maxWidth, this.maxHeight, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();
      return processed;
    } catch (error) {
      logger.error('ImageProcessor preprocessImage error:', error);
      return null;
    }
  }

  /**
   * Generates or retrieves a cached embedding for an image buffer.
   */
  async getEmbedding(imageBuffer) {
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
    if (this.embeddingCache.has(hash)) {
      return this.embeddingCache.get(hash);
    }
    try {
      const embedding = await this.vertexAI.getImageEmbedding(imageBuffer);
      this.embeddingCache.set(hash, embedding);
      return embedding;
    } catch (error) {
      logger.error('ImageProcessor getEmbedding error:', error);
      throw error;
    }
  }

  /**
   * Batch process images for embeddings (for future scalability).
   */
  async batchGetEmbeddings(imageBuffers) {
    return Promise.all(imageBuffers.map(buf => this.getEmbedding(buf)));
  }
}

module.exports = ImageProcessor; 