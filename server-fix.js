
// =====================================
// POST /api/consensus (テストモード)
// =====================================
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    const mode = meta.mode || 'consensus';
    
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    console.log('[CONSENSUS] Mode:', mode, 'Prompt:', prompt.substring(0, 50));

    // テストレスポンス（プロバイダー呼び出しなし）
    return res.json({
      final: '【テスト回答】' + prompt,
      mode: mode,
      judge: { model: 'gpt-4o-mini', method: mode, reason: 'Test mode' },
      candidates: [
        { provider: 'grok', magi_unit: 'BALTHASAR-2', ok: true, text: 'Grok: ' + prompt },
        { provider: 'gemini', magi_unit: 'MELCHIOR-1', ok: true, text: 'Gemini: ' + prompt },
        { provider: 'claude', magi_unit: 'CASPER-3', ok: true, text: 'Claude: ' + prompt }
      ],
      metrics: {
        agreement_ratio: 0.66,
        response_time_ms: 1000,
        valid_responses: 3
      }
    });

  } catch (error) {
    console.error('[CONSENSUS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});
