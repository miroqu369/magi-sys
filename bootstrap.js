'use strict';
const express = require('express');

global.app = express();
app.use(express.json({ limit: '1mb' }));

// 基盤ルート
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/status', (_req, res) => res.json({
  service: 'magi-app',
  time: new Date().toISOString(),
  secrets: {
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
  }
}));

// server.js 読込
try { require('./server.js'); } catch (e) { console.error('server.js error:', e); }

// listen
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`listening :${PORT}`));
