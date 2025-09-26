'use strict';

// global.appを使用（bootstrap.jsで作成されたもの）
const app = global.app;

if (!app) {
  console.error('ERROR: global.app is not defined');
  throw new Error('global.app must be created in bootstrap.js');
}

// プロバイダの読み込み
let GrokProvider, GeminiProvider, AnthropicProvider, OpenAIProvider;

try {
  GrokProvider = require('./providers/grok');
  GeminiProvider = require('./providers/gemini');
  AnthropicProvider = require('./providers/anthropic');
  OpenAIProvider = require('./providers/openai');
} catch (e) {
  console.error('Provider loading error:', e);
}

// Grok疎通確認エンドポイント
app.post('/api/grok/ping', async (req, res) => {
  console.log('Grok ping requested');
  try {
    const provider = new GrokProvider();
    await provider.ping();
    const text = await provider.chat('Say "Hello from Grok"', { temperature: 0.1 });
    res.json({ ok: true, text });
  } catch (error) {
    console.error('Grok ping error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 合議エンドポイント
app.post('/api/consensus', async (req, res) => {
  console.log('Consensus requested:', req.body);
  try {
    const { prompt, meta = {} } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const temperature = meta.temperature ?? 0.2;
    const timeout_ms = meta.timeout_ms ?? 25000;

    // 各プロバイダを並列実行
    const results = await Promise.allSettled([
      runWithTimeout(() => new GrokProvider().chat(prompt, { temperature }), timeout_ms, 'grok'),
      runWithTimeout(() => new GeminiProvider().chat(prompt, { temperature }), timeout_ms, 'gemini'),
      runWithTimeout(() => new AnthropicProvider().chat(prompt, { temperature }), timeout_ms, 'claude')
    ]);

    // 結果を整形
    const candidates = results.map((result, idx) => {
      const providers = ['grok', 'gemini', 'claude'];
      if (result.status === 'fulfilled') {
        return {
          provider: providers[idx],
          ok: true,
          text: result.value
        };
      } else {
        return {
          provider: providers[idx],
          ok: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // 成功した回答を取得
    const successfulResponses = candidates.filter(c => c.ok && c.text);
    
    // 類似度計算
    const agreementRatio = calculateAgreement(successfulResponses);

    let finalResponse;
    let judge = null;

    if (agreementRatio >= 0.66) {
      finalResponse = successfulResponses[0]?.text || 'No response available';
      judge = { model: 'consensus', reason: 'High agreement between models' };
    } else {
      try {
        const judgeResult = await judgeWithGPT(prompt, candidates);
        finalResponse = judgeResult.final;
        judge = {
          model: 'gpt-4o-mini',
          reason: judgeResult.reason,
          winner: judgeResult.winner
        };
      } catch (error) {
        finalResponse = successfulResponses[0]?.text || 'No response available';
        judge = { model: 'fallback', reason: `GPT judge failed: ${error.message}` };
      }
    }

    res.json({
      final: finalResponse,
      judge,
      candidates,
      metrics: {
        agreement_ratio: agreementRatio
      }
    });

  } catch (error) {
    console.error('Consensus error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Grok独自回答モード
app.post('/api/grok-unique', async (req, res) => {
  console.log('Grok unique requested:', req.body);
  try {
    const { prompt, mode = 'creative', meta = {} } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const temperature = meta.temperature ?? 0.7;
    const timeout_ms = meta.timeout_ms ?? 30000;

    // Step 1: 3つのLLMで通常の合議を実行
    const consensusResults = await Promise.allSettled([
      runWithTimeout(() => new GeminiProvider().chat(prompt, { temperature: 0.2 }), timeout_ms, 'gemini'),
      runWithTimeout(() => new AnthropicProvider().chat(prompt, { temperature: 0.2 }), timeout_ms, 'claude'),
      runWithTimeout(() => new OpenAIProvider().chat(prompt, { temperature: 0.2 }), timeout_ms, 'gpt')
    ]);

    const otherResponses = consensusResults.map((result, idx) => {
      const providers = ['gemini', 'claude', 'gpt'];
      if (result.status === 'fulfilled') {
        return {
          provider: providers[idx],
          text: result.value
        };
      }
      return null;
    }).filter(r => r !== null);

    // Step 2: Grokに独自の視点で回答させる
    const grokProvider = new GrokProvider();
    let grokPrompt = buildGrokPrompt(mode, prompt, otherResponses);

    const grokResponse = await runWithTimeout(
      () => grokProvider.chat(grokPrompt, { temperature }),
      timeout_ms,
      'grok-unique'
    );

    // Step 3: メタ分析
    let metaAnalysis = null;
    if (meta.include_analysis) {
      try {
        const analysisPrompt = `Compare briefly: Others gave conventional answers, Grok provided ${mode} perspective. In 2 sentences, explain what makes Grok's response unique:`;
        metaAnalysis = await new OpenAIProvider().chat(analysisPrompt, { temperature: 0.3 });
      } catch (e) {
        metaAnalysis = 'Analysis unavailable';
      }
    }

    res.json({
      mode: mode,
      grok_response: grokResponse,
      original_prompt: prompt,
      consensus_views: otherResponses.map(r => ({
        provider: r.provider,
        summary: r.text.substring(0, 100) + '...'
      })),
      meta_analysis: metaAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grok unique error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Grokモード一覧
app.get('/api/grok-modes', (req, res) => {
  res.json({
    available_modes: [
      { mode: 'creative', description: '独創的で型破りな視点', temperature: 0.7 },
      { mode: 'critical', description: '批判的思考と反対意見', temperature: 0.6 },
      { mode: 'synthesis', description: '統合と革新的発展', temperature: 0.7 },
      { mode: 'humorous', description: 'ユーモアと風刺を交えた洞察', temperature: 0.8 },
      { mode: 'practical', description: '実践的で現実的なアドバイス', temperature: 0.5 }
    ]
  });
});

// Helper Functions
async function runWithTimeout(fn, ms, label) {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`${label} timeout`)), ms)
  );
  return Promise.race([fn(), timeout]);
}

function calculateAgreement(responses) {
  if (responses.length < 2) return 0;
  const texts = responses.map(r => r.text.toLowerCase());
  const words = texts.map(t => new Set(t.split(/\s+/)));
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const intersection = new Set([...words[i]].filter(x => words[j].has(x)));
      const union = new Set([...words[i], ...words[j]]);
      const similarity = intersection.size / union.size;
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

async function judgeWithGPT(prompt, candidates) {
  const provider = new OpenAIProvider();
  const judgePrompt = `
You are a judge selecting the best response.
Original question: "${prompt}"

Candidates:
${candidates.map((c, i) => `${i+1}. ${c.provider}: ${c.ok ? c.text : 'Failed'}`).join('\n')}

Return ONLY a JSON object with:
{
  "winner": "provider_name",
  "reason": "brief explanation",
  "final": "the best complete response to the original question"
}`;

  const response = await provider.chat(judgePrompt, { temperature: 0.1 });
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in judge response');
  return JSON.parse(jsonMatch[0]);
}

function buildGrokPrompt(mode, prompt, otherResponses) {
  const responsesText = otherResponses.map(r => `- ${r.provider}: ${r.text}`).join('\n');
  
  switch(mode) {
    case 'critical':
      return `Original question: "${prompt}"\nOther responses:\n${responsesText}\nProvide a CRITICAL perspective that challenges assumptions.`;
    case 'synthesis':
      return `Original question: "${prompt}"\nOther responses:\n${responsesText}\nSYNTHESIZE and EVOLVE these responses.`;
    case 'humorous':
      return `Original question: "${prompt}"\nOther responses:\n${responsesText}\nProvide a WITTY and SATIRICAL take.`;
    case 'practical':
      return `Original question: "${prompt}"\nOther responses:\n${responsesText}\nProvide PRACTICAL REALITY and actionable advice.`;
    default:
      return `Original question: "${prompt}"\nOther responses:\n${responsesText}\nProvide a UNIQUELY CREATIVE response.`;
  }
}

console.log('Server.js routes configured successfully');
