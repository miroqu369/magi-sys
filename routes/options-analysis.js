'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { expiration } = req.query;

    console.log(`[Options] Start: ${ticker}`);

    const result = await global.analyticsEngineExtended.analyzeOptions(ticker, expiration);

    console.log(`[Options] Complete: ${ticker}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Options analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
