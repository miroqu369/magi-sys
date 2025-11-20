'use strict';

const app = global.app;
const { GoogleAuth } = require('google-auth-library');

let googleAuth = null;

// ✅ 正しい Identity Token 取得方法
const getIdToken = async () => {
  try {
    if (!googleAuth) {
      googleAuth = new GoogleAuth();
    }
    
    const targetAudience = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net';
    
    // Cloud Run 内では、GoogleAuth が自動的にメタデータサーバーから
    // Identity Token を取得する IdTokenClient を作成
    const client = await googleAuth.getIdTokenClient(targetAudience);
    
    // リクエストヘッダーを取得（これが Authorization: Bearer {token} を含む）
    const headers = await client.getRequestHeaders?.() || {};
    const authHeader = headers.Authorization || headers.authorization || '';
    
    // "Bearer {token}" から "token" を抽出
    const token = authHeader.replace('Bearer ', '').trim();
    
    if (token) {
      return token;
    } else {
      console.error('ID Token取得エラー: Authorization ヘッダーが取得できません');
      return '';
    }
  } catch (e) {
    console.error('ID Token取得エラー:', e.message);
    return '';
  }
};

const loadFetch = async () => {
  const mod = await import('node-fetch');
  return mod.default;
};

// ============================================================
// 1. /api/consensus
// ============================================================
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    res.json({ final: `Analysis for: ${prompt.substring(0, 50)}` });
  } catch (e) {
    console.error('consensus error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// 2. /api/stock/search
// ============================================================
app.post('/api/stock/search', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    
    const fetch = await loadFetch();
    const token = await getIdToken();
    
    console.log('✅ /api/stock/search: token obtained:', token ? 'YES' : 'NO');
    
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
    
    console.log('✅ fetchStockData response:', response.status);
    
    if (!response.ok) {
      console.error('❌ fetchStockData error:', response.status, response.statusText);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('❌ stock/search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// 3. /api/documents/search-similar
// ============================================================
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
    console.error('search-similar error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
