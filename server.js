'use strict';
const app = global.app || require('express')();

// ========== LLM Consensus（既存） ==========
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }
    res.json({
      final: 'LLM consensus endpoint (existing)',
      prompt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== Data Provider Routes（新規） ==========
app.get('/api/providers', require('./routes/providers'));
app.post('/api/providers/use/:name', require('./routes/use-provider'));

// ========== Stock Analysis Routes（新規） ==========
app.post('/api/stock/analyze/:ticker', require('./routes/stock'));

module.exports = app;
