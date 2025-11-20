'use strict';
const express = require('express');
const path = require('path');

const app = global.app || express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// GET /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /api/consensus
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    const mode = meta.mode || 'consensus';
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    return res.json({
      final: '【テスト回答】' + prompt,
      mode: mode,
      judge: { model: 'gpt-4o-mini', method: mode },
      candidates: [
        { provider: 'grok', magi_unit: 'BALTHASAR-2', ok: true, text: 'Grok: テスト' },
        { provider: 'gemini', magi_unit: 'MELCHIOR-1', ok: true, text: 'Gemini: テスト' },
        { provider: 'claude', magi_unit: 'CASPER-3', ok: true, text: 'Claude: テスト' }
      ],
      metrics: { agreement_ratio: 0.66, response_time_ms: 1000, valid_responses: 3 }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/stock/fetch
app.post('/api/stock/fetch', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    return res.json({
      symbol: symbol,
      financialData: {
        companyName: `${symbol} Inc.`,
        currentPrice: 150.25,
        market: 'NASDAQ',
        marketCap: 2.5e12,
        per: 28.5,
        eps: 5.27,
        dividendYield: 0.012
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

console.log('[SERVER] Ready');

// Stock search route
const stockSearchRoute = require('./routes/stock-search');
app.use(stockSearchRoute);
const docSearchRoute = require('./routes/document-search');
app.use(docSearchRoute);
