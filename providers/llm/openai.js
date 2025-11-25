const BaseProvider = require('./base');
const { retry, isRetryableError } = require('../utils/retry');

class OpenAIProvider extends BaseProvider {
  constructor() {
    const config = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10),
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10)
    };
    super('openai', config);
    this.key = process.env.OPENAI_API_KEY;
  }

  isConfigured() {
    return !!this.key;
  }

  async send(prompt, options = {}) {
    const startTime = Date.now();
    if (!this.key) throw new Error('OPENAI_API_KEY not configured');
    const requestedTimeout = options.timeout || this.config.timeout;
    const timeout = Math.min(Math.max(requestedTimeout, 1000), 300000);
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries;
    try {
      const result = await retry(
        async () => await this._makeRequest(prompt, options, timeout),
        { maxAttempts: maxRetries, baseDelayMs: 1000, maxDelayMs: 10000, jitter: true, shouldRetry: isRetryableError, onRetry: (error, attempt, delay) => console.log(`[OpenAI] Retry ${attempt} after ${delay}ms`) }
      );
      const latency = Date.now() - startTime;
      return this._formatResponse(result.text, { tokens: result.tokens || null, usage: result.usage || null, model: result.model || this.config.model, latency, debug: { provider: 'openai' } });
    } catch (error) {
      throw this._enhanceError(error, { prompt, options, latency: Date.now() - startTime });
    }
  }

  async _makeRequest(prompt, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.model, messages: [{ role: 'user', content: prompt }], temperature: options.temperature ?? 0.2 }),
        signal: options.signal || controller.signal
      });
      clearTimeout(timeoutId);
      if (!resp.ok) { const errorData = await resp.json().catch(() => ({})); const error = new Error(`OpenAI API error: ${resp.status}`); error.status = resp.status; error.data = errorData; throw error; }
      const data = await resp.json();
      return { text: data.choices?.[0]?.message?.content || '', tokens: data.usage?.completion_tokens || null, usage: data.usage || null, model: this.config.model };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);
      throw error;
    }
  }

  async chat(prompt, opts = {}) {
    if (!this.key) throw new Error('OPENAI_API_KEY not configured');
    const result = await this.send(prompt, opts);
    return result.text;
  }
}

module.exports = OpenAIProvider;
