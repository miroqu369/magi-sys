class GrokProvider {
  constructor() {
    this.key = process.env.XAI_API_KEY || 'dummy-key';
    this.base = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    this.model = process.env.XAI_MODEL || 'grok-2';
  }

  async chat(prompt, opts = {}) {
    // ダミー実装（実際のAPIキーがない場合）
    if (this.key === 'dummy-key' || this.key === 'test-key') {
      return "Grok response: " + prompt;
    }
    
    try {
      const response = await fetch(`${this.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: opts.temperature || 0.7
        })
      });
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response from Grok';
    } catch (error) {
      console.error('Grok error:', error);
      return "Grok error: " + error.message;
    }
  }
}

module.exports = GrokProvider;
