'use strict';

async function call(prompt, opts = {}) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY not defined');
  
  const model = process.env.XAI_MODEL || 'grok-2';
  const baseURL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
  
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.7
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API ${response.status}: ${text}`);
  }
  
  const json = await response.json();
  const text = json.choices?.[0]?.message?.content || '';
  return String(text);
}

module.exports = { name: 'grok', call };
