'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { interval = '15m' } = req.query;

    console.log(`[Intraday] Start: ${ticker} interval=${interval}`);

    const result = await global.analyticsEngineExtended.analyzeIntraday(ticker, interval);

    console.log(`[Intraday] Complete: ${ticker}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Intraday analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
