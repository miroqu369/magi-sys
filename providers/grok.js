class GrokProvider {
  constructor() {
    this.key = process.env.XAI_API_KEY;
    this.base = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    this.model = process.env.XAI_MODEL || 'grok-2';
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
  async chat(prompt, opts = {}) {
    if (!this.key) throw new Error('XAI_API_KEY not configured');
    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.2
    };
    const resp = await fetch(`${this.base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
module.exports = GrokProvider;
