const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

/**
 * Stock search endpoint
 * POST /api/stock/search
 * Body: { "ticker": "AAPL" }
 */
router.post('/api/stock/search', async (req, res) => {
  const { ticker } = req.body;

  if (!ticker || ticker.trim().length === 0) {
    res.status(400).json({ error: 'ticker required' });
    return;
  }

  try {
    console.log(`🔍 Stock search: ${ticker}`);
    
    // Cloud Function URL
    const funcUrl = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData';
    
    // Identity Token を使用してCloud Function を呼び出し
    const token = process.env.GCP_IDENTITY_TOKEN || '';
    
    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ticker: ticker.toUpperCase() })
    });

    const data = await response.json();

    if (data.error) {
      res.status(500).json({
        error: data.error,
        ticker: ticker
      });
      return;
    }

    res.json({
      success: true,
      ticker: data.ticker,
      company_name: data.company_name,
      data: data.data,
      fetched_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({ 
      error: error.message,
      ticker: ticker 
    });
  }
});

module.exports = router;
