'use strict';

const app = global.app;

// ✅ Cloud Run のメタデータサーバーから直接 Identity Token を取得
const getIdToken = async () => {
  try {
    const fetch = await (async () => {
      const mod = await import('node-fetch');
      return mod.default;
    })();
    
    const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://asia-northeast1-screen-share-459802.cloudfunctions.net';
    
    const response = await fetch(metadataUrl, {
      headers: {
        'Metadata-Flavor': 'Google'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Metadata server error:', response.status);
      return '';
    }
    
    const token = await response.text();
    console.log('✅ Token obtained from metadata server:', token ? 'YES' : 'NO');
    return token.trim();
  } catch (e) {
    console.error('❌ ID Token取得エラー:', e.message);
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
    
    if (!token) {
      console.error('❌ No token received');
      return res.status(500).json({ error: 'Failed to obtain Identity Token' });
    }
    
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
      const text = await response.text();
      console.error('❌ Cloud Function error:', response.status, text.substring(0, 100));
      return res.status(response.status).json({ error: text });
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
    
    if (!token) {
      return res.status(500).json({ error: 'Failed to obtain Identity Token' });
    }
    
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
    
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('search-similar error:', e.message);
    res.status(500).json({ error: e.message });
  }
});
