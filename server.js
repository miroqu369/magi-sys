'use strict';

const app = global.app;

if (!app) {
  throw new Error('[server.js] global.app is not defined');
}

console.log('[server.js] Loading consensus module...');
const { runConsensus } = require('./consensus.js');
console.log('[server.js] Consensus module loaded successfully');

// /api/consensus エンドポイント
app.post('/api/consensus', async (req, res) => {
  try {
    console.log('[api/consensus] Request received:', JSON.stringify(req.body));
    
    const { prompt, meta = {} } = req.body;
    
    if (!prompt) {
      console.log('[api/consensus] Missing prompt');
      return res.status(400).json({ error: 'prompt is required' });
    }

    console.log('[api/consensus] Calling runConsensus...');
    const result = await runConsensus(prompt, meta);
    console.log('[api/consensus] Result:', JSON.stringify(result));
    
    res.json(result);
  } catch (error) {
    console.error('[api/consensus] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

console.log('[server.js] Routes registered successfully');
