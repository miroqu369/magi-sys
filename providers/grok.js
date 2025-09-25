'use strict';

const fetchFn = (...args) =>
  (typeof fetch !== 'undefined')
    ? fetch(...args)
    : import('node-fetch').then(m => m.default(...args));

class GrokProvider {
  constructor() {
    this.key   = process.env.XAI_API_KEY;
    this.base  = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    this.model = process.env.XAI_MODEL    || 'grok-2';
    if (!this.key) throw new Error('XAI_API_KEY is undefined');
  }

  async ping() {
    const resp = await fetchFn(`${this.base}/models`, {
      headers: { 'Authorization': `Bearer ${this.key}` },
    });
    if (!resp.ok) throw new Error(`xAI ping ${resp.status}: ${await resp.text()}`);
    return true;
  }

  async chat({ model, messages, temperature = 0.2, timeoutMs = 25000 }) {
    const body = {
      model: model || this.model,
      messages: messages,
      temperature: temperature
    };
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const resp = await fetchFn(`${this.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const text = await resp.text();
      if (!resp.ok) throw new Error(`xAI ${resp.status}: ${text}`);
      
      const json = JSON.parse(text);
      return json.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

module.exports = new GrokProvider();
