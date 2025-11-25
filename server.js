'use strict';
const app = global.app || require('express')();
const { enhancePromptWithSpec } = require('./spec-client');

// ========== LLM Consensus（仕様書統合版） ==========
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    // 仕様書をプロンプトに挿入
    const enhancedPrompt = global.specifications 
      ? enhancePromptWithSpec(prompt, global.specifications)
      : prompt;

    console.log('📝 Processing consensus with spec context:', !!global.specifications);

    // TODO: 実際の5つのAI呼び出しを実装
    res.json({
      final: 'LLM consensus endpoint (with spec context)',
      prompt: enhancedPrompt.substring(0, 200) + '...',
      spec_context_used: !!global.specifications,
      meta
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== Data Provider Routes（既存） ==========
app.get('/api/providers', require('./routes/providers'));
app.post('/api/providers/use/:name', require('./routes/use-provider'));

// ========== Stock Analysis Routes（既存） ==========
app.post('/api/stock/analyze/:ticker', require('./routes/stock'));

// ========== NEW: Stock Analysis with AI Consensus ==========
app.post('/api/stock/ai-analysis/:ticker', require('./routes/stock-ai-analysis'));

module.exports = app;
