class AnthropicProvider {
    constructor() {
        this.key = process.env.ANTHROPIC_API_KEY;
        this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    }
    async chat(prompt, opts = {}) {
        if (!this.key) throw new Error('ANTHROPIC_API_KEY not configured');
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 2048,
                temperature: opts.temperature ?? 0.2,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await resp.json();
        // デバッグ用
        console.log('Claude response:', JSON.stringify(data).substring(0, 200));
        // 正しいパス
        return data.content?.[0]?.text || 'Claude応答エラー';
    }
}
module.exports = AnthropicProvider;
