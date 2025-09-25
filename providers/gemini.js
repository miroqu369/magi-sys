'use strict';

const fetchFn = (...args) =>
  (typeof fetch !== 'undefined')
    ? fetch(...args)
    : import('node-fetch').then(m => m.default(...args));

class GeminiProvider {
  constructor() {
    this.key   = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    if (!this.key) throw new Error('GEMINI_API_KEY is undefined');
  }

  async chat({ model, messages, temperature = 0.7, timeoutMs = 25000 }) {
    // messagesをGemini形式に変換
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      contents: contents,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 1000
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || this.model}:generateContent?key=${this.key}`;
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const text = await resp.text();
      if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${text}`);

      const json = JSON.parse(text);
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

module.exports = new GeminiProvider();
