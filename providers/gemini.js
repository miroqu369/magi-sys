'use strict';

async function call(prompt, opts = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not defined');
  
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.max_tokens || 1024
      }
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API ${response.status}: ${text}`);
  }
  
  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return String(text);
}

module.exports = { name: 'gemini', call };
