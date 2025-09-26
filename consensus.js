'use strict';

const registry = require('./providers/registry.js');

function similarity(a, b) {
  if (!a || !b) return 0;
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function calculateEntropy(texts) {
  if (!texts || texts.length === 0) return 0;
  const freq = {};
  texts.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const total = texts.length;
  let entropy = 0;
  Object.values(freq).forEach(count => {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  });
  return entropy;
}

async function runConsensus(prompt, meta = {}) {
  console.log('[consensus] Starting with prompt:', prompt);

  const providers = ['grok', 'gemini', 'anthropic'];
  
  const results = await Promise.allSettled(
    providers.map(async (name) => {
      const provider = registry[name];
      return await provider.call(prompt, meta);
    })
  );

  const candidates = results.map((res, i) => ({
    provider: providers[i],
    ok: res.status === 'fulfilled',
    text: res.status === 'fulfilled' 
      ? String(res.value || '') 
      : String(res.reason?.message || 'error')
  }));

  const successTexts = candidates
    .filter(c => c.ok && c.text && c.text !== '[object Object]')
    .map(c => c.text);

  console.log('[consensus] Success count:', successTexts.length);

  let agreementRatio = 0;
  if (successTexts.length >= 2) {
    let totalSim = 0, count = 0;
    for (let i = 0; i < successTexts.length - 1; i++) {
      for (let j = i + 1; j < successTexts.length; j++) {
        totalSim += similarity(successTexts[i], successTexts[j]);
        count++;
      }
    }
    agreementRatio = count > 0 ? totalSim / count : 0;
  } else if (successTexts.length === 1) {
    agreementRatio = 1;
  }

  const entropy = calculateEntropy(successTexts);
  const mode = meta.mode || 'normal';

  if (mode === 'unanimous') {
    if (agreementRatio >= 0.9) {
      return {
        final_answer: successTexts[0] || 'No consensus',
        judge: null,
        reason: '全会一致により採択',
        confidence: agreementRatio,
        metrics: { agreement_ratio: agreementRatio, entropy },
        candidates
      };
    } else {
      return {
        final_answer: '不採択（意見の不一致）',
        judge: null,
        reason: `一致度 ${agreementRatio.toFixed(2)} が基準未満`,
        confidence: agreementRatio,
        metrics: { agreement_ratio: agreementRatio, entropy },
        candidates
      };
    }
  }

  if (agreementRatio >= 0.66) {
    return {
      final_answer: successTexts[0] || 'No valid response',
      judge: null,
      reason: '高い一致度により合意成立',
      confidence: agreementRatio,
      metrics: { agreement_ratio: agreementRatio, entropy },
      candidates
    };
  }

  // Mary裁定
  const mary = registry.openai;
  const judgePrompt = `以下の3つのAI回答を比較し、最も適切な回答を選んでJSON形式で返してください:

${candidates.map((c, i) => `[${i + 1}] ${c.provider}: ${c.text}`).join('\n\n')}

必ずこの形式で回答してください:
{"winner": "provider名", "reason": "選んだ理由", "final": "最終的な回答文"}`;

  try {
    const judgeRaw = await mary.call(judgePrompt, { temperature: 0.2 });
    const judgeStr = String(judgeRaw);
    const jsonMatch = judgeStr.match(/\{[\s\S]*\}/);
    const judgeData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (judgeData?.final) {
      return {
        final_answer: judgeData.final,
        judge: 'mary',
        reason: judgeData.reason || 'Mary裁定',
        confidence: agreementRatio,
        metrics: { agreement_ratio: agreementRatio, entropy },
        candidates
      };
    }
  } catch (e) {
    console.error('[consensus] Mary failed:', e.message);
  }

  return {
    final_answer: successTexts[0] || 'No valid response',
    judge: 'fallback',
    reason: 'Mary裁定失敗',
    confidence: agreementRatio,
    metrics: { agreement_ratio: agreementRatio, entropy },
    candidates
  };
}

module.exports = { runConsensus };
