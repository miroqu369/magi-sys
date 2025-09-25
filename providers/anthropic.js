'use strict';

const fetchFn = (...args) =>
  (typeof fetch !== 'undefined')
    ? fetch(...args)
    : import('node-fetch').then(m => m.default(...args));

class AnthropicProvider {
  constructor() {
    this.key = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    if (!this.key) throw new Error('ANTHROPIC_API_KEY is undefined');
  }

  async chat({ model, messages, temperature = 0.7, timeoutMs = 25000 }) {
    const body = {
      model: model || this.model,
      messages: messages,
      max_tokens: 1000,
      temperature: temperature
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetchFn('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.key,  // ✅ 正しいヘッダー
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const text = await resp.text();
      if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${text}`);

      const json = JSON.parse(text);
      return json.content?.[0]?.text ?? '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

module.exports = new AnthropicProvider();
