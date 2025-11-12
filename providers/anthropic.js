const BaseProvider = require('./base');
const { retry, isRetryableError } = require('../utils/retry');

class AnthropicProvider extends BaseProvider {
  constructor() {
    const config = {
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      timeout: parseInt(process.env.ANTHROPIC_TIMEOUT_MS || '30000', 10),
      maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '3', 10)
    };
    super('anthropic', config);
    this.key = process.env.ANTHROPIC_API_KEY;
  }

  isConfigured() {
    return !!this.key;
  }

  async send(prompt, options = {}) {
    const startTime = Date.now();
        
    if (!this.key) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Validate and sanitize timeout to prevent resource exhaustion
    const requestedTimeout = options.timeout || this.config.timeout;
    const timeout = Math.min(Math.max(requestedTimeout, 1000), 300000); // Between 1s and 5min
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries;
        
    try {
      const result = await retry(
        async () => await this._makeRequest(prompt, options, timeout),
        {
          maxAttempts: maxRetries,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          jitter: true,
          shouldRetry: isRetryableError,
          onRetry: (error, attempt, delay) => {
            console.log(`[Anthropic] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
          }
        }
      );

      const latency = Date.now() - startTime;
      return this._formatResponse(result.text, {
        tokens: result.usage?.total_tokens || null,
        usage: result.usage || null,
        model: result.model || this.config.model,
        latency,
        debug: { provider: 'anthropic' }
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      throw this._enhanceError(error, { prompt, options, latency });
    }
  }

  async _makeRequest(prompt, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 2048,
          temperature: options.temperature ?? 0.2,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: options.signal || controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const error = new Error(`Anthropic API error: ${resp.status} ${resp.statusText}`);
        error.status = resp.status;
        error.data = errorData;
        throw error;
      }

      const data = await resp.json();
      console.log('Claude response:', JSON.stringify(data).substring(0, 200));
            
      return {
        text: data.content?.[0]?.text || 'Claude応答エラー',
        usage: data.usage,
        model: data.model
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        timeoutError.name = 'AbortError';
        throw timeoutError;
      }
      throw error;
    }
  }

  // Maintain backward compatibility with existing chat() method
  async chat(prompt, opts = {}) {
    if (!this.key) throw new Error('ANTHROPIC_API_KEY not configured');
    const result = await this.send(prompt, opts);
    return result.text;
  }
}
module.exports = AnthropicProvider;
