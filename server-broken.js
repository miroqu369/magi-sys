'use strict';
const express = require('express');
const app = global.app || express();

// プロバイダーをロード
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');
const SYSTEM_VERSION = '2.0.0';
// /api/grok/ping - Grok疎通確認
app.post('/api/grok/ping', async (req, res) => {
  try {
    const grok = new GrokProvider();
    await grok.ping();
    const text = await grok.chat('Hello, this is a test. Reply with OK.', { temperature: 0.1 });
    res.json({ ok: true, text, version: SYSTEM_VERSION });
  } catch (error) {
    console.error('Grok ping error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
// /api/consensus - 合議エンドポイント（v2.0）
app.post('/api/consensus', async (req, res) => {
  const startTime = Date.now();
  const { prompt, meta = {} } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  const temperature = meta.temperature ?? 0.2;
  const timeout_ms = meta.timeout_ms ?? 25000;
  const mode = meta.mode ?? 'consensus';
  console.log(`[MAGI v${SYSTEM_VERSION}] Mode: ${mode.toUpperCase()}, Prompt: "${prompt.substring(0, 50)}..."`);
  try {
    // 3つのAIを並列実行
    const results = await Promise.allSettled([
      executeWithTimeout('grok', () => new GrokProvider().chat(prompt, { temperature }), timeout_ms),
      executeWithTimeout('gemini', () => new GeminiProvider().chat(prompt, { temperature }), timeout_ms),
      executeWithTimeout('claude', () => new AnthropicProvider().chat(prompt, { temperature }), timeout_ms)
    ]);
    const candidates = results.map((result, idx) => {
      const providers = ['grok', 'gemini', 'claude'];
      const magi_names = ['BALTHASAR-2', 'MELCHIOR-1', 'CASPER-3'];
      const roles = ['創造的・革新的分析', '論理的・科学的分析', '人間的・感情的分析'];
      
      if (result.status === 'fulfilled') {
        return {
          provider: providers[idx],
          magi_unit: magi_names[idx],
          role: roles[idx],
          ok: true,
          text: result.value
        };
      } else {
        return {
          provider: providers[idx],
          magi_unit: magi_names[idx],
          role: roles[idx],
          ok: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    // 一致度計算
    const validTexts = candidates.filter(c => c.ok).map(c => c.text);
    const agreementRatio = calculateAgreement(validTexts);
    
    let finalAnswer;
    let judgeInfo = null;
    let synthesisMethod = null;
    // モード別処理
    switch(mode) {
      case 'integration':
        console.log(`[GPT-4 Integration Mode]`);
        const integrationResult = await integrateWithGPT(prompt, candidates);
        finalAnswer = integrationResult.final;
        judgeInfo = {
          name: "Isabelle",
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          reason: integrationResult.reason,
          method: 'integration',
          decision: 'INTEGRATED',
          insights: integrationResult.insights
        };
        synthesisMethod = 'gpt_integration';
        break;
      case 'synthesis':
        console.log(`[Advanced Synthesis Mode]`);
        const synthesisResult = await synthesizeResponses(prompt, candidates);
        finalAnswer = synthesisResult.final;
        judgeInfo = {
          name: "Isabelle",
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          reason: synthesisResult.reason,
          method: 'synthesis',
          insights: synthesisResult.insights,
          decision: 'SYNTHESIZED'
        };
        synthesisMethod = 'advanced_synthesis';
        break;
      case 'consensus':
      default:
        if (agreementRatio >= 0.66) {
          console.log(`[Consensus Reached: ${(agreementRatio * 100).toFixed(1)}%]`);
          finalAnswer = validTexts[0] || 'No valid responses';
          judgeInfo = { 
            model: 'consensus', 
            reason: `合議により一致度${(agreementRatio * 100).toFixed(1)}%で合意`,
            decision: 'APPROVED'
          };
          synthesisMethod = 'majority_consensus';
        } else {
          console.log(`[GPT-4 Arbitration Required]`);
          const openai = new OpenAIProvider();
          const judgeResult = await openai.judge(prompt, candidates);
          finalAnswer = judgeResult.final;
          judgeInfo = {
          name: "Isabelle",
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            reason: judgeResult.reason,
            winner: judgeResult.winner,
            decision: 'ARBITRATED'
          };
          synthesisMethod = 'gpt_arbitration';
        }
    }
    const totalTime = Date.now() - startTime;
    
    res.json({
      version: SYSTEM_VERSION,
      final: finalAnswer,
      mode: mode,
      judge: judgeInfo,
      candidates,
      metrics: {
        agreement_ratio: agreementRatio,
        response_time_ms: totalTime,
        synthesis_method: synthesisMethod,
        valid_responses: validTexts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Consensus error:', error);
    res.status(500).json({ 
      error: error.message,
      version: SYSTEM_VERSION 
    });
  }
});
// GPT-4統合関数
async function integrateWithGPT(originalPrompt, candidates) {
  const openai = new OpenAIProvider();
  
  const integrationPrompt = `あなたはMAGIシステムの最終統合判断を行うGPT-4です。
【元の質問】${originalPrompt}
【3つのMAGIユニットの回答】
${candidates.map(c => `${c.magi_unit} (${c.role}): ${c.ok ? c.text : '[エラー]'}`).join('\n---\n')}
【統合タスク】各回答の長所を活かし、包括的な回答を生成してください。
【出力形式】必ず以下のJSON形式で回答:
{"final": "統合された最終回答", "reason": "統合の根拠", "insights": ["洞察1", "洞察2"]}`;
  try {
    const response = await openai.chat(integrationPrompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // If no JSON match, return the raw response
    return {
      final: response || 'Integration failed',
      reason: "GPT-4による統合判断",
      insights: []
    };
  } catch (e) {
    console.log('Integration parse error:', e);
    return {
      final: 'Integration failed',
      reason: "GPT-4統合エラー",
      insights: []
    };
  }
}
// 高度な合成関数
async function synthesizeResponses(originalPrompt, candidates) {
  const openai = new OpenAIProvider();
  
  const synthesisPrompt = `あなたはMAGIシステムの高度な合成判断を行うGPT-4です。
【元の質問】${originalPrompt}
【3つのMAGIユニットの分析】
${candidates.map(c => `${c.magi_unit}: ${c.ok ? c.text : '[エラー]'}`).join('\n---\n')}
【創発的合成タスク】各ユニットの特性を融合させ、創発的な回答を生成。
【出力形式】必ず以下のJSON形式で回答:
{"final": "合成された回答", "reason": "合成プロセス", "insights": {"creative": "創造的洞察", "logical": "論理的洞察", "emotional": "感情的洞察"}}`;
  try {
    const response = await openai.chat(synthesisPrompt, { temperature: 0.4 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // If no JSON match, return the raw response
    return {
      final: response || 'Synthesis failed',
      reason: "高度な合成による判断",
      insights: {}
    };
  } catch (e) {
    console.log('Synthesis parse error:', e);
    return {
      final: 'Synthesis failed',
      reason: "合成プロセスエラー",
      insights: {}
    };
  }
}
// ユーティリティ関数
async function executeWithTimeout(name, fn, timeout) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${timeout}ms`)), timeout)
    )
  ]);
}
function calculateAgreement(texts) {
  if (texts.length < 2) return 0;
  
  const tokenize = (text) => text.toLowerCase().split(/\s+/);
  const tokens = texts.map(tokenize);
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const set1 = new Set(tokens[i]);
      const set2 = new Set(tokens[j]);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      totalSimilarity += intersection.size / union.size;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}
console.log('✅ MAGI v2.0 server module loaded');
module.exports = app;
// ===============================================
// ====== MAGI DECISION MODE (SINGLE) ======
app.post('/api/decision', async (req, res) => {
    console.log('[DECISION] Request received');
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
    }
    
    const decision = prompt.toLowerCase().includes('should') ? '承認' : '否認';
    
    res.json({
        final: decision,
        reason: 'Test decision',
        units: [
            { magi_unit: 'BALTHASAR-2', decision: decision },
            { magi_unit: 'MELCHIOR-1', decision: decision },
            { magi_unit: 'CASPER-3', decision: decision }
        ]
    });
});
console.log('✅ Decision endpoint registered');
