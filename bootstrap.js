'use strict';
const express = require('express');
const path = require('path');

// 1) 単一app
global.app = express();
app.use(express.json({ limit: '10mb' }));

// ✅ 静的ファイルサービスを追加
app.use(express.static(path.join(__dirname, 'public')));

// 2) 先に基盤ルート
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/status', (_req, res) => {
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
try { require('./server.js'); } catch (e) { console.error('server.js load error:', e); }

// 4) ルートパスで index.html を提供
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5) listenはここだけ
const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => console.log(`✓ bootstrap listening :${port}`));
