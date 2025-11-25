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

// ========== OAuth認証エンドポイント ==========
const { verifyToken, getAuthUrl } = require('./auth');

app.get('/auth/login', (req, res) => {
  const authUrl = getAuthUrl();
  res.json({ authUrl });
});

app.get('/auth/logout', (req, res) => {
  res.json({ message: 'Logged out', redirectUrl: '/' });
});

app.get('/auth/user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const user = await verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json(user);
});

console.log('✅ OAuth endpoints added');

// ========== magi-ac プロキシ ==========
const axios = require('axios');

app.post('/api/analyze', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8888/api/analyze', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/document/sentiment', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:8888/api/document/sentiment', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ magi-ac proxy endpoints added');
