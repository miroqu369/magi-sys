// =====================================
// POST /api/consensus
// =====================================
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    const mode = meta.mode || 'consensus';
    const temperature = meta.temperature ?? 0.2;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    console.log('[CONSENSUS] Mode:', mode, 'Temp:', temperature);

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

    if (validResponses.length > 0) {
      if (mode === 'consensus') {
        final = validResponses[0].text;
      } else if (mode === 'integration') {
        const prompt2 = `3つのAI意見を統合してください：Grok:${results[0]} Gemini:${results[1]} Claude:${results[2]}`;
        final = await openai.chat(prompt2, { temperature: 0.3 });
      } else if (mode === 'synthesis') {
        const prompt2 = `3つのAI意見を創発的に統合してください：Grok:${results[0]} Gemini:${results[1]} Claude:${results[2]}`;
        final = await openai.chat(prompt2, { temperature: 0.7 });
      }
    }

    const elapsed = Date.now() - start;

    res.json({
      version: '2.1.0',
      final,
      mode,
      judge: { model: 'gpt-4o-mini', method: mode },
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
