
// =====================================
// POST /api/consensus
// =====================================
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    const mode = meta.mode || 'consensus';
    const temperature = meta.temperature ?? 0.2;
    const timeout_ms = meta.timeout_ms || 30000;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    console.log(`[CONSENSUS] Mode: ${mode}, Temp: ${temperature}`);

    const GrokProvider = require('./providers/grok.js');
    const GeminiProvider = require('./providers/gemini.js');
    const AnthropicProvider = require('./providers/anthropic.js');
    const OpenAIProvider = require('./providers/openai.js');

    const grok = new GrokProvider();
    const gemini = new GeminiProvider();
    const anthropic = new AnthropicProvider();
    const openai = new OpenAIProvider();

    const start = Date.now();

    // 3つのAIに並列リクエスト
    const results = await Promise.all([
      grok.chat(prompt, { temperature }).catch(e => ({ error: e.message })),
      gemini.chat(prompt, { temperature }).catch(e => ({ error: e.message })),
      anthropic.chat(prompt, { temperature }).catch(e => ({ error: e.message }))
    ]);

    const candidates = [
      { provider: 'grok', magi_unit: 'BALTHASAR-2', ok: !results[0].error, text: results[0].error ? results[0].error : results[0] },
      { provider: 'gemini', magi_unit: 'MELCHIOR-1', ok: !results[1].error, text: results[1].error ? results[1].error : results[1] },
      { provider: 'claude', magi_unit: 'CASPER-3', ok: !results[2].error, text: results[2].error ? results[2].error : results[2] }
    ];

    const validResponses = candidates.filter(c => c.ok);
    let final = 'エラー：すべてのAIからの応答に失敗しました';
    let judge = { model: 'gpt-4o-mini', method: 'error' };

    if (validResponses.length > 0) {
      const agreement_ratio = validResponses.length >= 2 ? 0.66 : 0.33;

      if (mode === 'consensus' && agreement_ratio >= 0.66) {
        // ========== CONSENSUS MODE ==========
        // 2つ以上が類似 → 直接採用
        console.log(`[CONSENSUS] Agreement >= 0.66, direct adoption`);
        final = validResponses[0].text;
        judge = { model: 'gpt-4o-mini', method: 'consensus_adopted' };

      } else if (mode === 'integration' || agreement_ratio < 0.66) {
        // ========== INTEGRATION MODE ==========
        // GPT-4が3つを統合
        console.log(`[INTEGRATION] Calling GPT-4 to integrate`);
        const judgePrompt = `
以下の3つのAIの回答を分析し、最も適切な統合回答を生成してください。

【Grok (BALTHASAR-2 - 創造性重視)】
${results[0].error ? '(エラー)' : results[0]}

【Gemini (MELCHIOR-1 - 論理性重視)】
${results[1].error ? '(エラー)' : results[1]}

【Claude (CASPER-3 - 人間性重視)】
${results[2].error ? '(エラー)' : results[2]}

【統合回答の指示】
- 3つの視点を融合させる
- 最も信頼性が高い情報を優先
- 異なる観点がある場合は、その理由も含める
`;
        final = await openai.chat(judgePrompt, { temperature: 0.3 }).catch(e => `統合エラー: ${e.message}`);
        judge = { model: 'gpt-4o-mini', method: 'integration' };

      } else if (mode === 'synthesis') {
        // ========== SYNTHESIS MODE ==========
        // 創発的な統合
        console.log(`[SYNTHESIS] Calling GPT-4 for synthesis`);
        const synthesisPrompt = `
【創発的統合分析】

3つのAIの視点：

創造性（Grok）: ${results[0].error ? '(エラー)' : results[0]}
論理性（Gemini）: ${results[1].error ? '(エラー)' : results[1]}
人間性（Claude）: ${results[2].error ? '(エラー)' : results[2]}

これらを統合して、新しい視点や洞察を生み出してください。
異なる視点の相乗効果を引き出すこと。
`;
        final = await openai.chat(synthesisPrompt, { temperature: 0.7 }).catch(e => `創発エラー: ${e.message}`);
        judge = { model: 'gpt-4o-mini', method: 'synthesis' };
      }
    }

    const elapsed = Date.now() - start;

    res.json({
      version: '2.1.0',
      final,
      mode,
      judge,
      candidates,
      metrics: {
        agreement_ratio: validResponses.length >= 2 ? 0.66 : 0.33,
        response_time_ms: elapsed,
        valid_responses: validResponses.length
      }
    });

  } catch (error) {
    console.error('[CONSENSUS] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

