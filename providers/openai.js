'use strict';

async function call(prompt, opts = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not defined');
  
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    throw new Error(`OpenAI API ${response.status}: ${text}`);
  }
  
  const json = await response.json();
  const text = json.choices?.[0]?.message?.content || '';
  return String(text);
}

module.exports = { name: 'openai', call };
