'use strict';
const express = require('express');
const path = require('path');

// Express アプリケーション作成
const app = express();
global.app = app;  // グローバルに設定（重要！）

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ヘルスチェックエンドポイント
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
    status: 'OPERATIONAL'
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.json({
    message: 'MAGI System v2.0',
    endpoints: ['/healthz', '/status', '/api/consensus']
  });
});

// server.js をロード
try {
  require('./server.js');
  console.log('✅ server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error.message);
}

// サーバー起動
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MAGI System v2.0 listening on port ${port}`);
  console.log(`   Available endpoints:`);
  console.log(`   - GET  /healthz`);
  console.log(`   - GET  /status`);
  console.log(`   - POST /api/consensus`);
});
