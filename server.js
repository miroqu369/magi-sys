'use strict';
const express = require('express');
const app = global.app || express(); // ← 必ず global.app を優先

/* === callChat fallback (utilsが無くても動く) === */
let callChat;
try {
  const u = require('./utils/callChat');
  if (u && typeof u.callChat === 'function') callChat = u.callChat;
} catch {}
if (!callChat) {
  const openai    = require('./providers/openai');
  const gemini    = require('./providers/gemini');
  const grok      = require('./providers/grok');
  const anthropic = require('./providers/anthropic');
  callChat = async (provider, prompt, meta = {}) => {
    const messages    = [{ role: 'user', content: prompt }];
    const temperature = meta?.temperature ?? 0.2;
    const timeoutMs   = meta?.timeout_ms ?? 25000;
    switch (provider) {
      case 'grok':      return grok.chat({      model: process.env.XAI_MODEL       || 'grok-2',                    messages, temperature, timeoutMs });
      case 'gemini':    return gemini.chat({    model: process.env.GEMINI_MODEL    || 'gemini-1.5-pro',           messages, temperature, timeoutMs });
      case 'anthropic': return anthropic.chat({ model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest', messages, temperature, timeoutMs });
      case 'openai':    return openai.chat({    model: process.env.OPENAI_MODEL    || 'gpt-4o-mini',              messages, temperature, timeoutMs });
      default: throw new Error(`Unsupported provider: ${provider}`);
    }
  };
}
/* === end fallback === */

// ---- 既存のルート部分は残す ----
// ---- consensus ----
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt (string) is required' });
    }

    const results = await Promise.allSettled([
      callChat('grok', prompt, meta),
      callChat('gemini', prompt, meta),
      callChat('anthropic', prompt, meta),
    ]);
    const providers = ['grok','gemini','anthropic'];
    const candidates = results.map((r, i) =>
      r.status === 'fulfilled'
        ? { provider: providers[i], text: String(r.value || '').trim() }
        : { provider: providers[i], error: String(r.reason?.message || r.reason || 'failed') }
    );

    const texts = candidates.filter(c => c.text).map(c => c.text);
    let agreement_ratio = 0;
    if (texts.length >= 2) {
      const base = texts[0];
      agreement_ratio = texts.filter(t => t === base).length / texts.length;
    } else if (texts.length === 1) {
      agreement_ratio = 1;
    }

    let final = texts[0] || '';
    let judge = null;

    if (agreement_ratio < 0.66) {
      try {
        const judged = await callChat(
          'openai',
          `以下の候補から最良の一つを短く選び、必要なら軽く要約して返してください（事実整合・網羅・簡潔を重視）。\n\n` +
          candidates.map((c, i) => `(${i+1}) [${c.provider}] ${c.text || c.error || 'N/A'}`).join('\n'),
          meta
        );
        if (judged) { final = String(judged).trim(); judge = 'openai'; }
      } catch (_) { /* judgeが落ちても候補先頭 */ }
    }

    res.json({ final, judge, candidates, metrics: { agreement_ratio } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e.message || e) });
  }
});

