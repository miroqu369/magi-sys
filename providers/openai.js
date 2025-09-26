class OpenAIProvider {
  constructor() {
    this.key = process.env.OPENAI_API_KEY || 'dummy-key';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async chat(prompt, opts = {}) {
    // ダミー実装
    if (this.key === 'dummy-key' || this.key === 'test-key') {
      return "GPT response: " + prompt;
    }

    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: this.key });
      
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: opts.temperature || 0.7
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error);
      return "OpenAI error: " + error.message;
    }
  }
}

module.exports = OpenAIProvider;
