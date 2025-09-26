'use strict';
class GeminiProvider {
  constructor() {
    this.key = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    if (!this.key) throw new Error('GEMINI_API_KEY undefined');
  }
  async chat(prompt, opts = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.key}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: opts.temperature ?? 0.2 }
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Gemini ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}
module.exports = GeminiProvider;
