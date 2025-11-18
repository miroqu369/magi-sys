'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const opts = req.body || {};

    console.log(`[Technical] Start: ${ticker}`);

    const result = await global.analyticsEngineExtended.analyzeTechnical(ticker);

    console.log(`[Technical] Complete: ${ticker}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Technical analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
