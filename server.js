'use strict';

const app = global.app;
const { GoogleAuth } = require('google-auth-library');

// Identity Token を取得
let idToken = null;
const auth = new GoogleAuth();

const getIdToken = async () => {
  try {
    const targetAudience = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net';
    const client = await auth.getIdTokenClient(targetAudience);
    const response = await client.request({ url: targetAudience });
    return response.headers.authorization.replace('Bearer ', '');
  } catch (e) {
    console.error('Error getting ID token:', e.message);
    return '';
  }
};

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
    const token = await getIdToken();
    
    const response = await fetch(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticker })
      }
    );
    
    const data = await response.json();
    res.json(data);
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
    const token = await getIdToken();
    
    const response = await fetch(
      'https://asia-northeast1-screen-share-459802.cloudfunctions.net/searchSimilar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, top_k, threshold })
      }
    );
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
