'use strict';
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

const app = global.app;

// Grok疎通確認
app.post('/api/grok/ping', async (req, res) => {
  try {
    const grok = new GrokProvider();
    await grok.ping();
    const text = await grok.chat('Hello', { temperature: 0.2 });
    res.json({ ok: true, text });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 合議エンドポイント
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const opts = {
      temperature: meta.temperature ?? 0.2,
      timeout_ms: meta.timeout_ms ?? 25000
    };

    // 3エンジン並列実行
    const [grokRes, geminiRes, claudeRes] = await Promise.allSettled([
      new GrokProvider().chat(prompt, opts).then(text => ({ provider: 'grok', ok: true, text })),
      new GeminiProvider().chat(prompt, opts).then(text => ({ provider: 'gemini', ok: true, text })),
      new AnthropicProvider().chat(prompt, opts).then(text => ({ provider: 'claude', ok: true, text }))
    ]);

    const candidates = [
      grokRes.status === 'fulfilled' ? grokRes.value : { provider: 'grok', ok: false, error: grokRes.reason.message },
      geminiRes.status === 'fulfilled' ? geminiRes.value : { provider: 'gemini', ok: false, error: geminiRes.reason.message },
      claudeRes.status === 'fulfilled' ? claudeRes.value : { provider: 'claude', ok: false, error: claudeRes.reason.message }
    ];

    const texts = candidates.filter(c => c.ok).map(c => c.text);
    
    // 簡易一致度計算
    let agreement_ratio = 0;
    if (texts.length >= 2) {
      const similarities = [];
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const sim = calculateSimilarity(texts[i], texts[j]);
          similarities.push(sim);
        }
      }
      agreement_ratio = similarities.length > 0 
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length 
        : 0;
    }

    let final = texts[0] || '回答を取得できませんでした';
    let judge = null;

    // 一致度が低い場合はGPTで裁定
    if (agreement_ratio < 0.66 && texts.length > 1) {
      const judgePrompt = `以下の3つのAI回答を比較し、最も適切な回答を選んでください。
回答は必ずJSON形式で返してください: {"winner":"grok/gemini/claude", "reason":"理由", "final":"最終回答文"}

【Grok回答】
${candidates[0].ok ? candidates[0].text : 'エラー'}

【Gemini回答】
${candidates[1].ok ? candidates[1].text : 'エラー'}

【Claude回答】
${candidates[2].ok ? candidates[2].text : 'エラー'}`;

      const openai = new OpenAIProvider();
      const judgeText = await openai.chat(judgePrompt, { temperature: 0.2 });
      
      // JSON抽出
      const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const judgeData = JSON.parse(jsonMatch[0]);
        final = judgeData.final || final;
        judge = {
          model: 'gpt-4o-mini',
          reason: judgeData.reason || '判定完了'
        };
      }
    }

    res.json({
      final,
      judge,
      candidates,
      metrics: { agreement_ratio }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 簡易類似度計算
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

console.log('server.js loaded successfully');
