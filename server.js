'use strict';

const app = global.app;

// node-fetch をインポート
const loadFetch = async () => {
  const mod = await import('node-fetch');
  return mod.default;
};

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
    
    const fetch = await loadFetch();
    const response = await fetch(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      }
    );
    res.json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. /api/documents/search-similar
app.post('/api/documents/search-similar', async (req, res) => {
  try {
    const { query, top_k = 10, threshold = 0.5 } = req.body;
    if (!query) return res.status(400).json({ error: 'query required' });
    
    const fetch = await loadFetch();
    const response = await fetch(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/searchSimilar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k, threshold })
      }
    );
    res.json(await response.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
