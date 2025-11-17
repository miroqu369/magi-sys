'use strict';

module.exports = async (req, res) => {
  try {
    const { name } = req.params;

    if (!global.dataManager.providers[name]) {
      return res.status(404).json({
        success: false,
        error: `Provider '${name}' not registered`
      });
    }

    global.dataManager.use(name);

    res.json({
      success: true,
      message: `Switched to provider: ${name}`,
      active: global.dataManager.active,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};
