'use strict';
const express = require('express');
const path = require('path');

// ポートは必ず環境変数から取得
const PORT = parseInt(process.env.PORT) || 8080;
console.log(`Starting DOGMA System on port ${PORT}`);

// Express app作成
const app = express();
app.use(express.json({ limit: '1mb' }));

// ヘルスチェック
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', port: PORT });
});

app.get('/status', (req, res) => {
  res.json({
    service: 'DOGMA System',
    version: '2.0.0',
    port: PORT,
    time: new Date().toISOString(),
    env_port: process.env.PORT,
    actual_port: PORT,
    secrets: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      XAI_API_KEY: !!process.env.XAI_API_KEY
    }
  });
});

// グローバルに設定（server.jsから参照可能にする）
global.app = app;

// server.jsを読み込み
try {
  require('./server.js');
  console.log('Server.js loaded successfully');
} catch (err) {
  console.error('Error loading server.js:', err.message);
}

// 静的ファイル
app.use(express.static('public'));

// ルート
app.get('/', (req, res) => {
  res.send('DOGMA System Online - Port: ' + PORT);
});

// サーバー起動（ポートを明示的に指定）
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`DOGMA System listening on port ${PORT}`);
  console.log(`Environment PORT: ${process.env.PORT}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
