'use strict';

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('✅ [server] Loading server.js');

const app = global.app || require('express')();

// ==========================================
// Consensus API
// ==========================================
app.post('/api/consensus', async (req, res) => {
  const { prompt, meta } = req.body;
  try {
    console.log('📊 [consensus] Processing:', prompt.substring(0, 50));
    res.json({
      final: 'Consensus response from 3 AI engines',
      mode: meta?.mode || 'consensus',
      candidates: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Stock Search API
// ==========================================
  
  try {
    console.log('📈 [stock] Searching:', ticker);
    const funcUrl = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData';
    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GCP_IDENTITY_TOKEN || ''}`
      },
      body: JSON.stringify({ ticker })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ [stock] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// Similar Document Search API
// ==========================================
app.post('/api/documents/search-similar', async (req, res) => {
  const { query, top_k = 10, threshold = 0.5 } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  
  try {
    console.log('🔍 [search] Query:', query);
    const funcUrl = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/searchSimilar';
    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GCP_IDENTITY_TOKEN || ''}`
      },
      body: JSON.stringify({ query, top_k, threshold })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ [search] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ [server] All routes registered');

// ✅ Stock Search Route
app.post('/api/stock/search', async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) {
    res.status(400).json({ error: 'ticker required' });
    return;
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const funcUrl = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData';
    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GCP_IDENTITY_TOKEN || ''}`
      },
      body: JSON.stringify({ ticker })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
