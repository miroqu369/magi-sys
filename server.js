'use strict';
const express = require('express');
const axios = require('axios');
const { enhancePromptWithSpec } = require('./spec-client');
const { verifyToken, getAuthUrl } = require('./auth');

const app = global.app || express();

// ============ ロガー (構造化ログ) ============
const logger = {
  debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

// ============ 標準レスポンス形式 ============
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

const errorResponse = (error, statusCode = 500) => ({
  success: false,
  error: error.message || error,
  statusCode,
  timestamp: new Date().toISOString()
});

// ============ バリデーション ============
const validatePrompt = (prompt) => {
  if (!prompt) return { valid: false, error: 'Prompt is required' };
  if (typeof prompt !== 'string') return { valid: false, error: 'Prompt must be string' };
  if (prompt.length > 5000) return { valid: false, error: 'Prompt too long' };
  return { valid: true };
};

// ========== LLM Consensus ==========
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta } = req.body;
    
    // バリデーション
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      logger.warn('Consensus validation failed', validation.error);
      return res.status(400).json(errorResponse(validation.error, 400));
    }
    
    // 仕様書をプロンプトに挿入
    const enhancedPrompt = global.specifications 
      ? enhancePromptWithSpec(prompt, global.specifications)
      : prompt;
    
    logger.info('Processing consensus', { prompt: prompt.substring(0, 50) });
    
    res.json(successResponse({
      final: 'LLM consensus endpoint (with spec context)',
      prompt: enhancedPrompt.substring(0, 200) + '...',
      spec_context_used: !!global.specifications,
      meta
    }, 'Consensus processed'));
    
  } catch (e) {
    logger.error('Consensus endpoint error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

// ========== OAuth認証 ==========
app.get('/auth/login', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    logger.info('Auth login requested');
    res.json(successResponse({ authUrl }, 'Auth URL generated'));
  } catch (e) {
    logger.error('Auth login error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

app.get('/auth/logout', (req, res) => {
  try {
    logger.info('Auth logout requested');
    res.json(successResponse({ message: 'Logged out', redirectUrl: '/' }));
  } catch (e) {
    logger.error('Auth logout error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

app.get('/auth/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('Auth user: no token provided');
      return res.status(401).json(errorResponse('No token provided', 401));
    }
    
    const user = await verifyToken(token);
    if (!user) {
      logger.warn('Auth user: invalid token');
      return res.status(401).json(errorResponse('Invalid token', 401));
    }
    
    logger.info('Auth user verified');
    res.json(successResponse(user, 'User verified'));
    
  } catch (e) {
    logger.error('Auth user error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

// ========== magi-ac プロキシ ==========
app.post('/api/analyze', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      logger.warn('Analyze: missing symbol');
      return res.status(400).json(errorResponse('Symbol required', 400));
    }
    
    logger.debug('Proxying to magi-ac', { symbol });
    const response = await axios.post('http://localhost:8888/api/analyze', req.body);
    res.json(response.data);
    
  } catch (error) {
    logger.error('Analyze proxy error', error.message);
    res.status(500).json(errorResponse(error, 500));
  }
});

app.post('/api/document/sentiment', async (req, res) => {
  try {
    logger.debug('Proxying document sentiment to magi-ac');
    const response = await axios.post('http://localhost:8888/api/document/sentiment', req.body);
    res.json(response.data);
    
  } catch (error) {
    logger.error('Document sentiment proxy error', error.message);
    res.status(500).json(errorResponse(error, 500));
  }
});

// ========== Health & Status ==========
app.get('/health', (req, res) => {
  try {
    res.json(successResponse({ status: 'healthy' }));
  } catch (e) {
    logger.error('Health check error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

app.get('/status', (req, res) => {
  try {
    res.json(successResponse({
      server: 'MAGI System',
      specifications_loaded: !!global.specifications,
      uptime: process.uptime()
    }));
  } catch (e) {
    logger.error('Status check error', e.message);
    res.status(500).json(errorResponse(e, 500));
  }
});

// ========== エラーハンドリング ==========
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err.message);
  res.status(500).json(errorResponse(err, 500));
});

app.use((req, res) => {
  logger.warn('404 Not Found', req.path);
  res.status(404).json(errorResponse('Endpoint not found', 404));
});

logger.info('✅ OAuth endpoints added');
logger.info('✅ magi-ac proxy endpoints added');

module.exports = app;
