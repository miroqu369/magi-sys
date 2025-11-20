'use strict';
const app = global.app;
const yahooFinance = require('yahoo-finance2');

// Yahoo Finance からリアルタイムデータを取得
const getStockData = async (ticker) => {
  try {
    const result = await yahooFinance.quote(ticker);
    
    return {
      price: result.regularMarketPrice || 0,
      pe_ratio: result.trailingPE || 0,
      eps: result.epsTrailingTwelveMonths || 0,
      dividend_yield: (result.dividendYield || 0) * 100,  // パーセンテージに変換
      market_cap: result.marketCap || 0,
      currency: result.currency || 'USD'
    };
  } catch (e) {
    console.error(`❌ Yahoo Finance error for ${ticker}:`, e.message);
    return null;
  }
};

app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    res.json({ final: `Analysis for: ${prompt.substring(0, 50)}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/stock/search', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    
    console.log(`🔍 Fetching real data for ${ticker} from Yahoo Finance`);
    const data = await getStockData(ticker);
    
    if (!data) return res.status(404).json({ error: 'Ticker not found or API error' });
    
    console.log(`✅ Successfully retrieved ${ticker}`);
    res.json({ ticker, ...data });
  } catch (e) {
    console.error('❌ stock/search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
