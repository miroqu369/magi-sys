'use strict';
const app = global.app || require('express')();

// プロバイダーをロード
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

// ========== LLM Consensus（3つのモード対応） ==========
app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt, meta = {} } = req.body;
    const mode = meta.mode || 'consensus';
    
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }

    // 3つのLLMから並列で回答を取得
    const [grokRes, geminiRes, claudeRes] = await Promise.allSettled([
      new GrokProvider().chat(prompt, meta),
      new GeminiProvider().chat(prompt, meta),
      new AnthropicProvider().chat(prompt, meta)
    ]);

    const candidates = [
      {
        provider: 'grok',
        ok: grokRes.status === 'fulfilled',
        text: grokRes.status === 'fulfilled' ? grokRes.value : '❌ Error'
      },
      {
        provider: 'gemini',
        ok: geminiRes.status === 'fulfilled',
        text: geminiRes.status === 'fulfilled' ? geminiRes.value : '❌ Error'
      },
      {
        provider: 'claude',
        ok: claudeRes.status === 'fulfilled',
        text: claudeRes.status === 'fulfilled' ? claudeRes.value : '❌ Error'
      }
    ];

    // Mode ごとの処理
    if (mode === 'consensus') {
      // 合議モード：各LLMの独立回答のみ
      return res.json({
        final: 'Consensus mode - each LLM responds independently',
        mode: 'consensus',
        candidates,
        metrics: { agreement_ratio: 0 }
      });
    }

    if (mode === 'integration') {
      // Integration モード：GPT-4が統合判定
      const validResponses = candidates.filter(c => c.ok).map(c => c.text).join('\n---\n');
      
      if (validResponses.length === 0) {
        return res.json({
          final: 'All LLM responses failed',
          mode: 'integration',
          candidates
        });
      }

      const judgePrompt = `以下の3つのLLMの回答を読んで、最も的確な統合回答を生成してください：\n\n${validResponses}`;
      
      try {
        const finalAnswer = await new OpenAIProvider().chat(judgePrompt, meta);
        return res.json({
          final: finalAnswer,
          mode: 'integration',
          judge: { model: 'gpt-4o-mini', method: 'integration' },
          candidates
        });
      } catch (judgeError) {
        return res.json({
          final: 'Judge failed, returning first valid response',
          mode: 'integration',
          candidates
        });
      }
    }

    if (mode === 'synthesis') {
      // Synthesis モード：Yes/No判定
      const validResponses = candidates.filter(c => c.ok).map(c => c.text).join('\n');
      const synthesisPrompt = `以下のプロンプトに対して、3つのLLMの回答を見て、最終的に「Yes」か「No」で判定してください：\n\nプロンプト: ${prompt}\n\n回答:\n${validResponses}`;
      
      try {
        const judgment = await new OpenAIProvider().chat(synthesisPrompt, meta);
        return res.json({
          final: judgment,
          mode: 'synthesis',
          judge: { model: 'gpt-4o-mini', method: 'synthesis' },
          candidates
        });
      } catch (judgeError) {
        return res.json({
          final: 'Judgment failed',
          mode: 'synthesis',
          candidates
        });
      }
    }

    res.json({
      final: 'Unknown mode',
      mode,
      candidates
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== Data Provider Routes（既存） ==========
app.get('/api/providers', require('./routes/providers'));
app.post('/api/providers/use/:name', require('./routes/use-provider'));

// ========== Stock Analysis Routes（既存） ==========
app.post('/api/stock/analyze/:ticker', require('./routes/stock'));
app.post('/api/stock/ai-analysis/:ticker', require('./routes/stock-ai-analysis'));

module.exports = app;

// ========== 拡張機能ルート ==========

// テクニカル分析
app.post('/api/technical/:ticker', require('./routes/technical-analysis'));

// イントラデイ分析
app.get('/api/intraday/:ticker', require('./routes/intraday-analysis'));

// オプション分析
app.get('/api/options/:ticker', require('./routes/options-analysis'));

// 企業情報
app.get('/api/company/:ticker', require('./routes/company-profile'));

// ポートフォリオ分析
app.post('/api/portfolio/analyze', require('./routes/portfolio-analysis'));

// セクター比較
app.get('/api/sector/:sector', require('./routes/sector-analysis'));

console.log('✓ Extended routes registered');
