class GeminiProvider {
  constructor() {
    this.key = process.env.GEMINI_API_KEY || 'dummy-key';
    this.model = 'gemini-pro';
  }

  async chat(prompt, opts = {}) {
    // ダミー実装
    if (this.key === 'dummy-key' || this.key === 'test-key') {
      return "Gemini response: " + prompt;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.key);
      const model = genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini error:', error);
      return "Gemini error: " + error.message;
    }
  }
}

module.exports = GeminiProvider;
