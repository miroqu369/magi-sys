class AnthropicProvider {
  constructor() {
    this.key = process.env.ANTHROPIC_API_KEY || 'dummy-key';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  }

  async chat(prompt, opts = {}) {
    // ダミー実装
    if (this.key === 'dummy-key' || this.key === 'test-key') {
      return "Claude response: " + prompt;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: opts.temperature || 0.7
        })
      });

      const data = await response.json();
      return data.content?.[0]?.text || 'No response from Claude';
    } catch (error) {
      console.error('Claude error:', error);
      return "Claude error: " + error.message;
    }
  }
}

module.exports = AnthropicProvider;
