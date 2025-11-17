'use strict';
const express = require('express');
const DataManager = require('./core/data-manager');
const AnalyticsEngine = require('./core/analytics-engine');

// ========== 1) 単一app ==========
global.app = express();
app.use(express.json({ limit: '1mb' }));

// ========== 2) Data Manager初期化 ==========
global.dataManager = new DataManager();

// Yahoo Finance プロバイダー登録（ダミー - 既存コード流用可）
const YahooProvider = require('./providers/data/base');
if (process.env.YAHOO_API_KEY) {
  global.dataManager.register('yahoo', YahooProvider, {
    apiKey: process.env.YAHOO_API_KEY,
    timeout: 5000
  });
} else {
  console.warn('⚠ YAHOO_API_KEY not set - using mock provider');
  global.dataManager.register('mock', YahooProvider, { timeout: 5000 });
}

// ========== 3) Analytics Engine初期化 ==========
global.analyticsEngine = new AnalyticsEngine(global.dataManager);

// ========== 4) 基盤ルート ==========
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.get('/status', async (_req, res) => {
  try {
    const providers = await global.dataManager.status();
    
    res.json({
      service: 'magi-app-extended',
      version: '3.0.0',
      time: new Date().toISOString(),
      secrets: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        XAI_API_KEY: !!process.env.XAI_API_KEY,
        ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
        YAHOO_API_KEY: !!process.env.YAHOO_API_KEY,
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY
      },
      dataProviders: providers
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== 5) アプリ本体読込 ==========
try { require('./server.js'); } catch (e) { console.error('server.js load error:', e); }

// ========== 6) listen ==========
const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`✓ bootstrap listening :${port}`);
  console.log(`✓ Active data provider: ${global.dataManager.active}`);
  console.log(`✓ Analytics engine ready`);
});
