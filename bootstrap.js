'use strict';
const express = require('express');

global.app = express();
global.app.use(express.json({ limit: '1mb' }));

console.log('✅ [1/5] app instance created');

// ✅ /health ルート
global.app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// ✅ /healthz ルート
global.app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

// ✅ /status ルート
global.app.get('/status', (_req, res) => {
  res.json({
    service: 'magi-app',
    time: new Date().toISOString(),
    secrets: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      XAI_API_KEY: !!process.env.XAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

console.log('✅ [2/5] Basic routes registered');

// ✅ server.js 読込
console.log('✅ [3/5] Loading server.js...');
try {
  require('./server.js');
  console.log('✅ [4/5] server.js loaded successfully');
} catch (err) {
  console.error('❌ [4/5] FATAL ERROR in server.js:');
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
}

// ✅ listen
console.log('✅ [5/5] Starting to listen...');
const PORT = Number(process.env.PORT) || 8080;
const server = global.app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [READY] magi-app listening on :${PORT}`);
});

// エラーハンドリング
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
