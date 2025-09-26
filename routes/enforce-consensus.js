/**
 * routes/enforce-consensus.js
 * どのサーバ実装でも /api/consensus を Mary 裁定版に強制マウントする
 */
module.exports = function mountConsensus(app) {
  try {
    const runConsensus = require('../consensus');
    const bp = require('body-parser');
    if (typeof app.use === 'function') app.use(bp.json({ limit: '1mb' }));

    if (typeof app.post === 'function') {
      app.post('/api/consensus', async (req, res) => {
        const prompt = (req.body && req.body.prompt) || '';
        const meta   = (req.body && req.body.meta) || {};
        try {
          const out = await runConsensus(prompt, meta);
          // マーカーを入れて「新経路」を可視化
          res.set('X-MAGI-Route', 'enforce-consensus.js');
          res.json(out);
        } catch (e) {
          console.error('consensus error', e);
          res.status(500).json({ error: 'consensus_failed', message: String(e && e.message || e) });
        }
      });
    }
  } catch (e) {
    console.error('mountConsensus failed', e);
  }
};
