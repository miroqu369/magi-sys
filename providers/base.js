/**
 * Base Provider Interface
 * All LLM providers should implement this interface to ensure consistent behavior
 * with timeout, cancellation, and standardized response format.
 */

class BaseProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
  }

  /**
   * Send a prompt to the LLM provider
   * @param {string} prompt - The prompt to send
   * @param {object} options - Optional parameters
   * @param {number} options.temperature - Temperature for response generation
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {AbortSignal} options.signal - AbortController signal for cancellation
   * @param {object} options.meta - Additional metadata
   * @returns {Promise<object>} Response object with standardized format
   * @throws {Error} If the request fails or times out
   */
  async send(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Subclasses should override this method
      throw new Error(`send() not implemented in ${this.name}`);
    } catch (error) {
      const latency = Date.now() - startTime;
      throw this._enhanceError(error, { prompt, options, latency });
    }
  }

  /**
   * Format a successful response in standardized format
   * @param {string} text - The response text
   * @param {object} metadata - Additional metadata
   * @returns {object} Standardized response object
   */
  _formatResponse(text, metadata = {}) {
    return {
      text: text || '',
      tokens: metadata.tokens || null,
      usage: metadata.usage || null,
      model: metadata.model || this.config.model || 'unknown',
      latency: metadata.latency || 0,
      debug: metadata.debug || {}
    };
  }

  /**
   * Enhance error with context
   * @param {Error} error - Original error
   * @param {object} context - Error context
   * @returns {Error} Enhanced error
   */
  _enhanceError(error, context = {}) {
    const enhancedError = new Error(
      `[${this.name}] ${error.message || 'Unknown error'}`
    );
    enhancedError.originalError = error;
    enhancedError.provider = this.name;
    enhancedError.context = context;
    enhancedError.timestamp = new Date().toISOString();
    return enhancedError;
  }

  /**
   * Check if provider is configured properly
   * @returns {boolean} True if provider is ready to use
   */
  isConfigured() {
    return true; // Subclasses should override if needed
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getName() {
    return this.name;
  }
}

module.exports = BaseProvider;
