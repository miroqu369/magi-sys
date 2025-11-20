'use strict';

const app = global.app;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 1. /api/consensus
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    res.json({ final: `Analysis for: ${prompt.substring(0, 50)}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. /api/stock/search
app.post('/api/stock/search', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    
    const f = await fetch;
    const response = await f(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticker })
      }
    );
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('stock/search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 3. /api/documents/search-similar
app.post('/api/documents/search-similar', async (req, res) => {
  try {
    const { query, top_k = 10, threshold = 0.5 } = req.body;
    if (!query) return res.status(400).json({ error: 'query required' });
    
    const f = await fetch;
    const response = await f(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/searchSimilar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, top_k, threshold })
      }
    );
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('search-similar error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
