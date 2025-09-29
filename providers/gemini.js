class GeminiProvider {
    constructor() {
        this.key = process.env.GEMINI_API_KEY;
        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    }
    async chat(prompt, opts = {}) {
        if (!this.key) throw new Error('GEMINI_API_KEY not configured');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.key}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: opts.temperature ?? 0.2,
                    maxOutputTokens: 2048
                }
            })
        });
        const data = await resp.json();
        console.log('Gemini response:', JSON.stringify(data).substring(0, 200));
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini応答エラー';
    }
}
module.exports = GeminiProvider;
