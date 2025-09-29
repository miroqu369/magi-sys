'use strict';
const express = require('express');
const path = require('path');

// グローバルappを作成
global.app = express();
const app = global.app;

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 基本エンドポイント
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/status', (_req, res) => {
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

// server.js をロード
try {
  require('./server.js');
  console.log('✅ server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error);
}

// サーバー起動
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MAGI System v2.0 listening on port ${port}`);
  console.log(`   BALTHASAR-2: ONLINE`);
  console.log(`   MELCHIOR-1: ONLINE`);
  console.log(`   CASPER-3: ONLINE`);
});
