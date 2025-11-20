'use strict';

const app = global.app;
const { GoogleAuth } = require('google-auth-library');

let auth = null;

// GoogleAuth を初期化
const initAuth = async () => {
  if (!auth) {
    auth = new GoogleAuth();
  }
  return auth;
};

// Identity Token を取得
const getIdToken = async () => {
  try {
    const googleAuth = await initAuth();
    const targetAudience = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net';
    const client = await googleAuth.getIdTokenClient(targetAudience);
    const res = await client.request({
      url: targetAudience,
      method: 'GET'
    });
    // Authorization ヘッダーから Bearer トークンを抽出
    const authHeader = res.config?.headers?.authorization || '';
    return authHeader.replace('Bearer ', '');
  } catch (e) {
    console.error('ID Token取得エラー:', e.message);
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
