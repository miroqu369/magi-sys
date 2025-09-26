'use strict';
const express = require('express');
const path = require('path');

// 1) 単一app作成
const app = express();
global.app = app;

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 2) 基盤ルート登録（最初に登録）
app.get('/healthz', (_req, res) => {
  console.log('Health check requested');
  res.status(200).send('ok');
});

app.get('/status', (_req, res) => {
  console.log('Status check requested');
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

// 3) アプリ本体読込
try {
  console.log('Loading server.js...');
  require('./server.js');
  console.log('Server.js loaded successfully');
} catch (e) {
  console.error('server.js load error:', e);
}

// 4) エラーハンドラー
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// 5) 404ハンドラー
app.use((req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).json({ error: 'Not Found', path: req.url });
});

// 6) listenはここだけ
const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Magi System listening on port ${port}`);
  console.log('Available routes:');
  console.log('  GET  /healthz');
  console.log('  GET  /status');
  console.log('  POST /api/consensus');
  console.log('  POST /api/grok-unique');
  console.log('  GET  /api/grok-modes');
});

module.exports = app;
