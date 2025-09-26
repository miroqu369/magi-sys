'use strict';

async function call(prompt, opts = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not defined');
  
  // 正しいモデル名に変更
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.max_tokens || 1024,
      temperature: opts.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${text}`);
  }
  
  const json = await response.json();
  const textParts = json.content
    ?.filter(block => block.type === 'text')
    .map(block => block.text) || [];
  
  return textParts.join(' ').trim() || 'No response';
}

module.exports = { name: 'anthropic', call };
