'use strict';
const app = global.app;

const getStockData = (ticker) => {
  const data = {
    'AAPL': { price: 229.45, pe_ratio: 32.5, eps: 7.05, dividend_yield: 0.42, market_cap: 3500000000000 },
    'GOOGL': { price: 178.90, pe_ratio: 28.3, eps: 6.32, dividend_yield: 0, market_cap: 1800000000000 },
    'MSFT': { price: 435.02, pe_ratio: 38.5, eps: 11.32, dividend_yield: 0.71, market_cap: 3200000000000 }
  };
  return data[ticker.toUpperCase()] || null;
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
    const data = getStockData(ticker);
    if (!data) return res.status(404).json({ error: 'Ticker not found' });
    res.json({ ticker, ...data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
