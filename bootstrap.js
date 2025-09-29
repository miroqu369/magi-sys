'use strict';
const express = require('express');
const path = require('path');

// Express アプリケーション作成
const app = express();

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ヘルスチェックエンドポイント（最重要）
app.get('/healthz', (req, res) => {
  console.log('Healthz endpoint called');
  res.status(200).send('ok');
});

// ステータスエンドポイント
app.get('/status', (req, res) => {
  console.log('Status endpoint called');
  res.json({
    service: 'magi-system',
    version: '2.0.0',
    time: new Date().toISOString(),
    status: 'OPERATIONAL',
    secrets: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      XAI_API_KEY: !!process.env.XAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
    },
    magi_units: {
      'BALTHASAR-2': 'READY',
      'MELCHIOR-1': 'READY',
      'CASPER-3': 'READY'
    }
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// グローバルに設定（server.jsで使用）
global.app = app;

// server.js をロード（APIエンドポイント追加）
try {
  require('./server.js');
  console.log('✅ server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error.message);
}

// 404ハンドラー（最後に追加）
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.path,
    version: '2.0.0'
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    version: '2.0.0'
  });
});

// サーバー起動
const port = process.env.PORT || 8080;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MAGI System v2.0 listening on port ${port}`);
  console.log(`   BALTHASAR-2: ONLINE`);
  console.log(`   MELCHIOR-1: ONLINE`);
  console.log(`   CASPER-3: ONLINE`);
  console.log(`   Available endpoints:`);
  console.log(`   - GET  /healthz`);
  console.log(`   - GET  /status`);
  console.log(`   - GET  /`);
  console.log(`   - POST /api/consensus`);
  console.log(`   - POST /api/grok/ping`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
