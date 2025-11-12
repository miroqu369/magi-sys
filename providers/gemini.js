const BaseProvider = require('./base');
const { retry, isRetryableError } = require('../utils/retry');

class GeminiProvider extends BaseProvider {
  constructor() {
    const config = {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '30000', 10),
      maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)
    };
    super('gemini', config);
    this.key = process.env.GEMINI_API_KEY;
  }

  isConfigured() {
    return !!this.key;
  }

  async send(prompt, options = {}) {
    const startTime = Date.now();
    if (!this.key) throw new Error('GEMINI_API_KEY not configured');
    const requestedTimeout = options.timeout || this.config.timeout;
    const timeout = Math.min(Math.max(requestedTimeout, 1000), 300000);
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.config.maxRetries;
    try {
      const result = await retry(
        async () => await this._makeRequest(prompt, options, timeout),
        { maxAttempts: maxRetries, baseDelayMs: 1000, maxDelayMs: 10000, jitter: true, shouldRetry: isRetryableError, onRetry: (error, attempt, delay) => console.log(`[Gemini] Retry ${attempt} after ${delay}ms`) }
      );
      const latency = Date.now() - startTime;
      return this._formatResponse(result.text, { tokens: result.tokens || null, usage: result.usage || null, model: result.model || this.config.model, latency, debug: { provider: 'gemini' } });
    } catch (error) {
      throw this._enhanceError(error, { prompt, options, latency: Date.now() - startTime });
    }
  }

  async _makeRequest(prompt, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.key}`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: options.temperature ?? 0.2, maxOutputTokens: 2048 } }), signal: options.signal || controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) { const errorData = await resp.json().catch(() => ({})); const error = new Error(`Gemini API error: ${resp.status}`); error.status = resp.status; error.data = errorData; throw error; }
      const data = await resp.json();
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini応答エラー', tokens: data.usageMetadata?.output_token_count || null, usage: data.usageMetadata || null, model: this.config.model };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);
      throw error;
    }
  }

  async chat(prompt, opts = {}) {
    if (!this.key) throw new Error('GEMINI_API_KEY not configured');
    const result = await this.send(prompt, opts);
    return result.text;
  }
}

module.exports = GeminiProvider;
