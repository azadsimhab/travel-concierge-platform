const fetch = require('node-fetch');
const logger = require('../../shared/utils/logger');

class DestinationMatcher {
  constructor(config) {
    this.matchingEngineEndpoint = config.matchingEngineEndpoint;
    this.topK = config.topK || 5;
  }

  /**
   * Queries the Matching Engine with an embedding and returns ranked results.
   */
  async findSimilarDestinations(embedding) {
    try {
      const response = await fetch(this.matchingEngineEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding, topK: this.topK })
      });
      if (!response.ok) throw new Error('Matching Engine query failed');
      const data = await response.json();
      return this.formatResults(data);
    } catch (error) {
      logger.error('DestinationMatcher findSimilarDestinations error:', error);
      return [];
    }
  }

  /**
   * Formats and enriches the Matching Engine results.
   */
  formatResults(results) {
    // Example: enrich with place details if available
    return (results.matches || []).map(match => ({
      id: match.id,
      name: match.metadata?.name || 'Unknown',
      description: match.metadata?.description || '',
      score: match.score,
      imageUrl: match.metadata?.imageUrl || null
    }));
  }
}

module.exports = DestinationMatcher; 