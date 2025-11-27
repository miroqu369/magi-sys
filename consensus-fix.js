// このコードを server.js の /api/consensus に置き換え
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

const grok = new GrokProvider();
const gemini = new GeminiProvider();
const anthropic = new AnthropicProvider();
// const openai = new OpenAIProvider();

async function callAllAIs(prompt) {
  const results = await Promise.allSettled([
    grok.isConfigured() ? grok.send(prompt) : Promise.reject('not configured'),
    gemini.isConfigured() ? gemini.send(prompt) : Promise.reject('not configured'),
    anthropic.isConfigured() ? anthropic.send(prompt) : Promise.reject('not configured'),
  ]);
  
  return {
    balthasar: results[0].status === 'fulfilled' ? results[0].value.text : null,
    melchior: results[1].status === 'fulfilled' ? results[1].value.text : null,
    casper: results[2].status === 'fulfilled' ? results[2].value.text : null,
  };
}
