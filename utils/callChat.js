const openai    = require('../providers/openai');
const gemini    = require('../providers/gemini');
const grok      = require('../providers/grok');
const anthropic = require('../providers/anthropic');

/**
 * provider: 'grok' | 'gemini' | 'anthropic' | 'openai'
 * meta: { temperature?, timeout_ms? }
 * 期待IF: 各 provider は chat({model, messages, temperature, timeoutMs}) を実装済み
 */
async function callChat(provider, prompt, meta = {}) {
  const messages   = [{ role: 'user', content: prompt }];
  const temperature = meta.temperature ?? 0.2;
  const timeoutMs   = meta.timeout_ms ?? 25000;

  switch (provider) {
    case 'grok':
      return grok.chat({
        model: process.env.XAI_MODEL || 'grok-2',
        messages, temperature, timeoutMs
      });

    case 'gemini':
      return gemini.chat({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        messages, temperature, timeoutMs
      });

    case 'anthropic':
      return anthropic.chat({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        messages, temperature, timeoutMs
      });

    case 'openai':
      return openai.chat({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages, temperature, timeoutMs
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

module.exports = { callChat };
