class OpenAIProvider {
    constructor() {
        this.key = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }
    async chat(prompt, opts = {}) {
        if (!this.key) throw new Error('OPENAI_API_KEY not configured');
        try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: opts.temperature ?? 0.2
                })
            });
            
            if (!resp.ok) {
                throw new Error(`OpenAI API error: ${resp.status} ${resp.statusText}`);
            }
            
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenAI chat error:', error.message);
            throw error;
        }
    }
}
module.exports = OpenAIProvider;
