'use strict';

module.exports = async (req, res) => {
  try {
    const { sector } = req.params;

    console.log(`[Sector] Start: ${sector}`);

    const result = await global.analyticsEngineExtended.compareSector(sector);

    console.log(`[Sector] Complete: ${sector}`);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Sector analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
