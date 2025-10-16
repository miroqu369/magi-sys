class OpenAIProvider {
    constructor() {
        this.key = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }
    async chat(prompt, opts = {}) {
        if (!this.key) throw new Error('OPENAI_API_KEY not configured');
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
            const errorText = await resp.text();
            throw new Error(`OpenAI API error (${resp.status}): ${errorText}`);
        }
        
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
    }
    async judge(originalPrompt, candidates) {
        if (!this.key) throw new Error('OPENAI_API_KEY not configured');
        
        const judgePrompt = `あなたはMAGIシステムの仲裁者です。以下の3つのAI回答を評価し、最適な回答を選択または統合してください。

【元の質問】${originalPrompt}

【候補回答】
${candidates.map(c => `${c.magi_unit} (${c.provider}): ${c.ok ? c.text : '[エラー]'}`).join('\n\n')}

【タスク】最も適切な回答を選択するか、複数の回答を統合して最適な回答を生成してください。

【出力形式】必ず以下のJSON形式で回答:
{"final": "最終回答", "reason": "選択または統合の理由", "winner": "選択したプロバイダー名（統合の場合は'integrated'）"}`;

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: judgePrompt }],
                temperature: 0.3
            })
        });
        
        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`OpenAI API error (${resp.status}): ${errorText}`);
        }
        
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.log('Judge parse error:', e);
        }
        
        // Fallback: return first valid response
        const firstValid = candidates.find(c => c.ok);
        return {
            final: firstValid ? firstValid.text : 'No valid responses',
            reason: 'Fallback to first valid response',
            winner: firstValid ? firstValid.provider : 'none'
        };
    }
}
module.exports = OpenAIProvider;
