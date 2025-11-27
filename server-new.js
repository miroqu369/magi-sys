'use strict';
const express = require('express');
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

const app = express();
app.use(express.json());

const grok = new GrokProvider();
const gemini = new GeminiProvider();
const anthropic = new AnthropicProvider();
const openaiProvider = new OpenAIProvider();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/status', (req, res) => res.json({
  grok: grok.isConfigured(),
  gemini: gemini.isConfigured(),
  claude: anthropic.isConfigured(),
  openai: openaiProvider.isConfigured()
}));

app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    console.log('[Consensus]', prompt.substring(0, 50));
    const start = Date.now();
    const r = await Promise.allSettled([
      grok.isConfigured() ? grok.send(prompt) : Promise.reject('n'),
      gemini.isConfigured() ? gemini.send(prompt) : Promise.reject('n'),
      anthropic.isConfigured() ? anthropic.send(prompt) : Promise.reject('n'),
      openaiProvider.isConfigured() ? openaiProvider.send(prompt) : Promise.reject('n')
    ]);
    const resp = {
      balthasar: r[0].status === 'fulfilled' ? r[0].value.text : null,
      melchior: r[1].status === 'fulfilled' ? r[1].value.text : null,
      casper: r[2].status === 'fulfilled' ? r[2].value.text : null,
      mary: r[3].status === 'fulfilled' ? r[3].value.text : null
    };
    const valid = Object.values(resp).filter(x => x);
    res.json({ final: valid[0] || 'No response', ...resp, metrics: { ms: Date.now() - start, valid: valid.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 8081, () => console.log('MAGI-SYS on ' + (process.env.PORT || 8081)));
