'use strict';
const express = require('express');
const app = global.app || express();
const path = require('path');

// Providers
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

// Initialize providers
let grok, gemini, anthropic, openai;
try {
  grok = new GrokProvider();
  gemini = new GeminiProvider();
  anthropic = new AnthropicProvider();
  openai = new OpenAIProvider();
  console.log('✅ All providers initialized');
} catch (err) {
  console.error('Provider initialization error:', err);
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Main consensus API endpoint
app.post('/api/consensus', async (req, res) => {
  const startTime = Date.now();
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  try {
    const { prompt } = req.body;
    const meta = req.body.meta || {};
    const mode = meta.mode || 'integration';
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required', traceId });
    }

    console.log(`[${traceId}] Processing ${mode} mode for: ${prompt.substring(0, 50)}...`);

    // Global request timeout - use provider timeout instead of global
    const requestTimeout = parseInt(process.env.REQUEST_TIMEOUT_MS || '45000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      // Execute parallel requests to all AI providers with unified timeout control
      const metaWithSignal = { ...meta, signal: controller.signal, timeout: requestTimeout };
      
      const results = await Promise.allSettled([
        grok.chat(prompt, metaWithSignal),
        gemini.chat(prompt, metaWithSignal),
        anthropic.chat(prompt, metaWithSignal)
      ]);
      
      clearTimeout(timeoutId);

      // Format responses
      const candidates = [
      {
        provider: 'grok',
        magi_unit: 'BALTHASAR-2',
        role: '創造的・革新的分析',
        ok: results[0].status === 'fulfilled',
        text: results[0].status === 'fulfilled' ? results[0].value : 'Error: No response',
        error: results[0].status === 'rejected' ? results[0].reason?.message : null
      },
      {
        provider: 'gemini',
        magi_unit: 'MELCHIOR-1',
        role: '論理的・科学的分析',
        ok: results[1].status === 'fulfilled',
        text: results[1].status === 'fulfilled' ? results[1].value : 'Error: No response',
        error: results[1].status === 'rejected' ? results[1].reason?.message : null
      },
      {
        provider: 'claude',
        magi_unit: 'CASPER-3',
        role: '人間的・感情的分析',
        ok: results[2].status === 'fulfilled',
        text: results[2].status === 'fulfilled' ? results[2].value : 'Error: No response',
        error: results[2].status === 'rejected' ? results[2].reason?.message : null
      }
    ];

      // Calculate metrics
      const validResponses = candidates.filter(c => c.ok);
      const minValidResponses = parseInt(process.env.MIN_VALID_RESPONSES || '1', 10);
      
      // Check if we have minimum required valid responses
      if (validResponses.length < minValidResponses) {
        console.error(`[${traceId}] Insufficient valid responses: ${validResponses.length}/${minValidResponses}`);
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: `Insufficient valid responses from providers (${validResponses.length}/${minValidResponses})`,
          traceId,
          candidates,
          version: '2.0.0'
        });
      }
      
      const metrics = {
        response_time_ms: Date.now() - startTime,
        valid_responses: validResponses.length,
        agreement_ratio: validResponses.length / 3,
        timestamp: new Date().toISOString(),
        traceId
      };

      let final = '';
      let judge = {
        model: 'gpt-4o-mini',
        method: mode
      };

      // Process based on mode
      if (mode === 'consensus') {
        // CONSENSUS MODE - Simple implementation without openai.judge
        if (validResponses.length === 0) {
          final = 'Error: No valid responses from AI units';
          judge.method = 'consensus-failed';
        } else if (validResponses.length === 1) {
            final = validResponses[0].text;
          judge.method = 'consensus-single';
          judge.winner = validResponses[0].provider;
        } else {
          // Use first valid response for now (simple implementation)
          final = validResponses[0].text;
          judge.method = 'consensus-first';
          judge.winner = validResponses[0].provider;
          judge.reason = 'Using first valid response';
        }
        
      } else if (mode === 'integration') {
        // INTEGRATION MODE - Use GPT-4 to integrate responses
        if (validResponses.length === 0) {
          final = 'Error: No valid responses to integrate';
          judge.method = 'integration-failed';
        } else {
          try {
            const integrationPrompt = `統合して最適な回答を提供してください：\n\n${
              validResponses.map(r => `[${r.magi_unit}]: ${r.text}`).join('\n\n')
            }`;
            
            final = await openai.chat(integrationPrompt, { temperature: 0.3 });
            judge.method = 'integration';
            judge.name = 'Isabelle';
            judge.reason = 'Integrated all valid responses';
          } catch (err) {
            console.error(`[${traceId}] Integration error:`, err.message);
            final = validResponses[0].text;
            judge.method = 'integration-fallback';
          }
        }
        
      } else if (mode === 'synthesis') {
        // SYNTHESIS MODE - Creative synthesis
        if (validResponses.length === 0) {
          final = 'Error: No valid responses for synthesis';
          judge.method = 'synthesis-failed';
        } else {
          try {
            const synthesisPrompt = `以下の分析を創造的に統合してください：\n\n${
              validResponses.map(r => `[${r.magi_unit}]: ${r.text}`).join('\n\n')
            }`;
            
            final = await openai.chat(synthesisPrompt, { temperature: 0.7 });
            judge.method = 'synthesis';
            judge.name = 'Isabelle';
            judge.reason = 'Creative synthesis completed';
          } catch (err) {
            console.error(`[${traceId}] Synthesis error:`, err.message);
            final = validResponses[0].text;
            judge.method = 'synthesis-fallback';
          }
        }
        
      } else {
        // Default to integration mode
        final = validResponses.length > 0 ? validResponses[0].text : 'Error: Invalid mode';
        judge.method = 'default';
      }

      // Send response
      res.json({
        version: '2.0.0',
        final,
        mode,
        judge,
        candidates,
        metrics
      });

    } catch (innerError) {
      clearTimeout(timeoutId);
      throw innerError;
    }

  } catch (error) {
    const traceIdFallback = `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const errorTraceId = error.traceId || traceIdFallback;
    console.error(`[${errorTraceId}] API Error:`, error.message, error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      traceId: errorTraceId,
      version: '2.0.0'
    });
  }
});

// Grok test endpoint
app.post('/api/grok/ping', async (req, res) => {
  try {
    const result = await grok.chat('ping', { temperature: 0.1 });
    res.json({ ok: true, text: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = app;
