'use strict';

module.exports = async (req, res) => {
  try {
    const status = await global.dataManager.status();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
