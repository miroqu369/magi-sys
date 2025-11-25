'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const opts = req.body || {};

    const result = await global.analyticsEngine.analyzeStock(ticker, opts);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Stock analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
