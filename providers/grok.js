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
        try {
            const resp = await fetch(`${this.base}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!resp.ok) {
                throw new Error(`Grok API error: ${resp.status} ${resp.statusText}`);
            }
            
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('Grok chat error:', error.message);
            throw error;
        }
    }
}
module.exports = GrokProvider;
