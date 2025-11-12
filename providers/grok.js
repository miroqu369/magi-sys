const BaseProvider = require('./base');
const { retry, isRetryableError } = require('../utils/retry');

class GrokProvider extends BaseProvider {
  constructor() {
    const config = {
      model: process.env.XAI_MODEL || 'grok-2',
      timeout: parseInt(process.env.XAI_TIMEOUT_MS || '30000', 10),
      maxRetries: parseInt(process.env.XAI_MAX_RETRIES || '3', 10)
    };
    super('grok', config);
    this.key = process.env.XAI_API_KEY;
    this.base = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
  }

  isConfigured() {
    return !!this.key;
  }

  async ping() {
    if (!this.key) return false;
    try {
      const resp = await fetch(`${this.base}/models`, {
        headers: { 'Authorization': `Bearer ${this.key}` }
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  async send(prompt, options = {}) {
    const startTime = Date.now();
    if (!this.key) throw new Error('XAI_API_KEY not configured');
    const requestedTimeout = options.timeout || this.config.timeout;
    const timeout = Math.min(Math.max(requestedTimeout, 1000), 300000);
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries;
    try {
      const result = await retry(
        async () => await this._makeRequest(prompt, options, timeout),
        { maxAttempts: maxRetries, baseDelayMs: 1000, maxDelayMs: 10000, jitter: true, shouldRetry: isRetryableError, onRetry: (error, attempt, delay) => console.log(`[Grok] Retry ${attempt} after ${delay}ms`) }
      );
      const latency = Date.now() - startTime;
      return this._formatResponse(result.text, { tokens: result.tokens || null, usage: result.usage || null, model: result.model || this.config.model, latency, debug: { provider: 'grok' } });
    } catch (error) {
      throw this._enhanceError(error, { prompt, options, latency: Date.now() - startTime });
    }
  }

  async _makeRequest(prompt, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const body = { model: this.config.model, messages: [{ role: 'user', content: prompt }], temperature: options.temperature ?? 0.2 };
      const resp = await fetch(`${this.base}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal || controller.signal
      });
      clearTimeout(timeoutId);
      if (!resp.ok) { const errorData = await resp.json().catch(() => ({})); const error = new Error(`Grok API error: ${resp.status}`); error.status = resp.status; error.data = errorData; throw error; }
      const data = await resp.json();
      return { text: data.choices?.[0]?.message?.content || '', tokens: data.usage?.completion_tokens || null, usage: data.usage || null, model: this.config.model };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);
      throw error;
    }
  }

  async chat(prompt, opts = {}) {
    if (!this.key) throw new Error('XAI_API_KEY not configured');
    const result = await this.send(prompt, opts);
    return result.text;
  }
}

module.exports = GrokProvider;
