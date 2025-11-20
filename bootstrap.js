'use strict';
const express = require('express');

// グローバル app 作成
global.app = express();
global.app.use(express.json({ limit: '1mb' }));

console.log('✅ [bootstrap] Creating app instance');

// ==========================================
// 基盤ルート登録（server.js より前）
// ==========================================
global.app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

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

console.log('✅ [bootstrap] /healthz and /status registered');

// ==========================================
// server.js 読み込み（ビジネスロジック）
// ==========================================
try {
  require('./server.js');
  console.log('✅ [bootstrap] server.js loaded successfully');
} catch (err) {
  console.error('❌ [bootstrap] Error loading server.js:', err.message);
}

// ==========================================
// listen（ここだけ）
// ==========================================
const PORT = Number(process.env.PORT) || 8080;
const server = global.app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [bootstrap] magi-app listening on :${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
