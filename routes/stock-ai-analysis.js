'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const opts = req.body || {};

    console.log(`[AI Analysis] Start: ${ticker}`);

    // 1. Stock Analysis を実行
    console.log(`[AI Analysis] Fetching stock data...`);
    const analysisResult = await global.analyticsEngine.analyzeStock(ticker, opts);
    console.log(`[AI Analysis] Stock data OK: ${analysisResult.ticker}`);

    const prompt = analysisResult.prompt;

    // 2. LLMプロバイダー読み込み（パス修正）
    console.log(`[AI Analysis] Loading LLM providers...`);
    let grok, gemini, claude, openai;
    try {
      // providers/ 直下から読み込み（存在確認後）
      try {
        const Grok = require('../providers/llm/grok');
        grok = new Grok();
        console.log(`[AI Analysis] Grok loaded from providers/llm/`);
      } catch (e1) {
        try {
          const Grok = require('../providers/grok');
          grok = new Grok();
          console.log(`[AI Analysis] Grok loaded from providers/`);
        } catch (e2) {
          console.warn(`[AI Analysis] Grok not available`);
          grok = null;
        }
      }

      try {
        const Gemini = require('../providers/llm/gemini');
        gemini = new Gemini();
        console.log(`[AI Analysis] Gemini loaded from providers/llm/`);
      } catch (e1) {
        try {
          const Gemini = require('../providers/gemini');
          gemini = new Gemini();
          console.log(`[AI Analysis] Gemini loaded from providers/`);
        } catch (e2) {
          console.warn(`[AI Analysis] Gemini not available`);
          gemini = null;
        }
      }

      try {
        const Claude = require('../providers/llm/anthropic');
        claude = new Claude();
        console.log(`[AI Analysis] Claude loaded from providers/llm/`);
      } catch (e1) {
        try {
          const Claude = require('../providers/anthropic');
          claude = new Claude();
          console.log(`[AI Analysis] Claude loaded from providers/`);
        } catch (e2) {
          console.warn(`[AI Analysis] Claude not available`);
          claude = null;
        }
      }

      try {
        const OpenAI = require('../providers/llm/openai');
        openai = new OpenAI();
        console.log(`[AI Analysis] OpenAI loaded from providers/llm/`);
      } catch (e1) {
        try {
          const OpenAI = require('../providers/openai');
          openai = new OpenAI();
          console.log(`[AI Analysis] OpenAI loaded from providers/`);
        } catch (e2) {
          throw new Error('OpenAI provider not found');
        }
      }

      if (!grok || !gemini || !claude) {
        throw new Error('Not all AI providers available');
      }

    } catch (e) {
      console.error(`[AI Analysis] Provider load failed:`, e.message);
      throw e;
    }

    // 3. 3つのAIを並列実行
    console.log(`[AI Analysis] Running 3-AI consensus...`);
    const [grokResult, geminiResult, claudeResult] = await Promise.all([
      grok.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => {
          console.log(`[AI Analysis] Grok OK (${text.length} chars)`);
          return { provider: 'grok', ok: true, text };
        })
        .catch(err => {
          console.error(`[AI Analysis] Grok FAILED:`, err.message);
          return { provider: 'grok', ok: false, error: err.message };
        }),
      gemini.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => {
          console.log(`[AI Analysis] Gemini OK (${text.length} chars)`);
          return { provider: 'gemini', ok: true, text };
        })
        .catch(err => {
          console.error(`[AI Analysis] Gemini FAILED:`, err.message);
          return { provider: 'gemini', ok: false, error: err.message };
        }),
      claude.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => {
          console.log(`[AI Analysis] Claude OK (${text.length} chars)`);
          return { provider: 'claude', ok: true, text };
        })
        .catch(err => {
          console.error(`[AI Analysis] Claude FAILED:`, err.message);
          return { provider: 'claude', ok: false, error: err.message };
        })
    ]);

    const candidates = [grokResult, geminiResult, claudeResult];
    const validResponses = candidates.filter(c => c.ok);
    console.log(`[AI Analysis] Valid responses: ${validResponses.length}/3`);

    // 4. 一致度を計算
    const agreementRatio = validResponses.length > 1
      ? calculateSimilarity(validResponses.map(v => v.text))
      : 0.5;

    // 5. GPT裁定
    console.log(`[AI Analysis] Running GPT judgment...`);
    const judgePrompt = `
以下の3つのAIからの投資判断を受け取りました。

【Grok】
${grokResult.ok ? grokResult.text : '利用不可'}

【Gemini】
${geminiResult.ok ? geminiResult.text : '利用不可'}

【Claude】
${claudeResult.ok ? claudeResult.text : '利用不可'}

これらの分析を統合し、最終的な投資判断をJSON形式で返してください：
{
  "final_judgment": "買い/売り/保有",
  "confidence": "高/中/低",
  "key_points": ["ポイント1", "ポイント2"],
  "risks": ["リスク1"],
  "recommendation": "推奨アクション"
}

JSON形式のみで返してください。
`;

    const judgeResponse = await openai.chat(judgePrompt, { temperature: 0.2 });
    console.log(`[AI Analysis] GPT judgment OK (${judgeResponse.length} chars)`);

    // JSON を抽出
    let judgeData = null;
    try {
      const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgeData = JSON.parse(jsonMatch[0]);
        console.log(`[AI Analysis] JSON parsed OK`);
      } else {
        throw new Error('No JSON in response');
      }
    } catch (e) {
      console.error(`[AI Analysis] JSON parse failed:`, e.message);
      judgeData = {
        final_judgment: 'HOLD',
        confidence: 'medium',
        key_points: ['分析完了'],
        risks: ['パース問題'],
        recommendation: '候補応答を参照'
      };
    }

    // 6. 結果統合
    const result = {
      ticker,
      timestamp: new Date().toISOString(),
      mode: 'ai-analysis-with-consensus',
      
      data_analysis: {
        provider: analysisResult.dataProvider,
        current_price: analysisResult.quote.price,
        currency: analysisResult.quote.currency,
        trend: analysisResult.metrics.trend,
        volatility: analysisResult.metrics.volatility,
        change_pct: analysisResult.metrics.change_pct
      },

      ai_analysis: {
        candidates: candidates.map(c => ({
          provider: c.provider,
          ok: c.ok,
          text: c.text ? c.text.substring(0, 300) : c.error
        })),
        agreement_ratio: (agreementRatio * 100).toFixed(1)
      },

      consensus: {
        judge: 'gpt-4o-mini',
        judgment: judgeData.final_judgment,
        confidence: judgeData.confidence,
        key_points: judgeData.key_points,
        risks: judgeData.risks,
        recommendation: judgeData.recommendation
      },

      final_output: {
        ticker,
        decision: judgeData.final_judgment,
        confidence: judgeData.confidence,
        recommendation: judgeData.recommendation
      }
    };

    console.log(`[AI Analysis] Complete: ${ticker} = ${result.final_output.decision}`);

    res.json({
      success: true,
      data: result
    });

  } catch (e) {
    console.error(`[AI Analysis] FATAL ERROR:`, e.message);
    console.error(e.stack);
    
    res.status(500).json({
      success: false,
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

function calculateSimilarity(texts) {
  if (texts.length < 2) return 0.5;
  const words = texts.map(t => t.toLowerCase().split(/\s+/));
  const intersection = new Set(words[0]).size;
  const union = new Set([...words[0], ...words[1]]).size;
  return intersection / union;
}
