'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;

    console.log(`[Company] Start: ${ticker}`);

    const result = await global.analyticsEngineExtended.getCompanyProfile(ticker);

    console.log(`[Company] Complete: ${ticker}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Company profile error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
