'use strict';
const express = require('express');
const DataManager = require('./core/data-manager');
const AnalyticsEngine = require('./core/analytics-engine');

// ========== 1) 単一app ==========
global.app = express();
app.use(express.json({ limit: '1mb' }));

// ========== 2) Data Manager初期化 ==========
global.dataManager = new DataManager();

// === Mock プロバイダー登録（テスト用） ===
const MockProvider = require('./providers/data/mock');
global.dataManager.register('mock', MockProvider, {
  timeout: 5000
});

// === MooMoo プロバイダー登録 ===
if (process.env.MOOMOO_API_KEY || process.env.MOOMOO_HOST) {
  try {
    const MoomooProvider = require('./providers/data/moomoo');
    global.dataManager.register('moomoo', MoomooProvider, {
      apiKey: process.env.MOOMOO_API_KEY,
      host: process.env.MOOMOO_HOST || 'localhost',
      port: parseInt(process.env.MOOMOO_PORT || '11111', 10),
      timeout: 8000
    });
    console.log('✓ MooMoo provider registered');
  } catch (e) {
    console.warn('⚠ MooMoo provider registration failed:', e.message);
  }
}

// === Yahoo Finance プロバイダー登録（API key あれば） ===
if (process.env.YAHOO_API_KEY) {
  try {
    const YahooProvider = require('./providers/data/yahoo-finance');
    global.dataManager.register('yahoo', YahooProvider, {
      apiKey: process.env.YAHOO_API_KEY,
      timeout: 5000
    });
    console.log('✓ Yahoo provider registered');
  } catch (e) {
    console.warn('⚠ Yahoo provider registration failed:', e.message);
  }
}

// === Finnhub プロバイダー登録（API key あれば） ===
if (process.env.FINNHUB_API_KEY) {
  try {
    const FinnhubProvider = require('./providers/data/finnhub');
    global.dataManager.register('finnhub', FinnhubProvider, {
      apiKey: process.env.FINNHUB_API_KEY,
      timeout: 5000
    });
    console.log('✓ Finnhub provider registered');
  } catch (e) {
    console.warn('⚠ Finnhub provider registration failed:', e.message);
  }
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
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
        MOOMOO_API_KEY: !!process.env.MOOMOO_API_KEY,
        MOOMOO_HOST: !!process.env.MOOMOO_HOST
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
