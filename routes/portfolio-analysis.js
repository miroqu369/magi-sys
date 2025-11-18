'use strict';

module.exports = async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ error: 'tickers array required' });
    }

    console.log(`[Portfolio] Start: ${tickers.join(', ')}`);

    const result = await global.analyticsEngineExtended.analyzePortfolio(tickers);

    console.log(`[Portfolio] Complete`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Portfolio analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
