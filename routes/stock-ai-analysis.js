'use strict';

module.exports = async (req, res) => {
  try {
    const { ticker } = req.params;
    const opts = req.body || {};

    // 1. Stock Analysis を実行（データ取得 + メトリクス計算）
    const analysisResult = await global.analyticsEngine.analyzeStock(ticker, opts);

    // 2. LLM合議用プロンプトを抽出
    const prompt = analysisResult.prompt;

    // 3. LLM合議を実行
    // 既存の consensus エンドポイントと同じロジック
    const Grok = require('../providers/llm/grok');
    const Gemini = require('../providers/llm/gemini');
    const Claude = require('../providers/llm/anthropic');
    const OpenAI = require('../providers/llm/openai');

    // プロバイダーインスタンス化
    const grok = new Grok();
    const gemini = new Gemini();
    const claude = new Claude();
    const openai = new OpenAI();

    // 4. 3つのAIを並列実行
    const [grokResult, geminiResult, claudeResult] = await Promise.all([
      grok.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => ({ provider: 'grok', ok: true, text }))
        .catch(err => ({ provider: 'grok', ok: false, error: err.message })),
      gemini.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => ({ provider: 'gemini', ok: true, text }))
        .catch(err => ({ provider: 'gemini', ok: false, error: err.message })),
      claude.chat(prompt, { temperature: opts.temperature || 0.3 })
        .then(text => ({ provider: 'claude', ok: true, text }))
        .catch(err => ({ provider: 'claude', ok: false, error: err.message }))
    ]);

    console.log(`Stock AI Analysis Results:`);
    console.log(`- Grok: ${grokResult.ok ? 'OK' : 'FAILED'}`);
    console.log(`- Gemini: ${geminiResult.ok ? 'OK' : 'FAILED'}`);
    console.log(`- Claude: ${claudeResult.ok ? 'OK' : 'FAILED'}`);

    const candidates = [grokResult, geminiResult, claudeResult];

    // 5. 一致度を計算
    const validResponses = candidates.filter(c => c.ok);
    const agreementRatio = validResponses.length > 1
      ? calculateSimilarity(validResponses.map(v => v.text))
      : 0.5;

    // 6. GPT裁定（常に実行）
    const judgePrompt = `
以下の3つのAIからの投資判断を受け取りました。

【Grok】
${grokResult.ok ? grokResult.text : '失敗'}

【Gemini】
${geminiResult.ok ? geminiResult.text : '失敗'}

【Claude】
${claudeResult.ok ? claudeResult.text : '失敗'}

これらの分析を統合し、最終的な投資判断を以下のJSON形式で返してください：
{
  "final_judgment": "最終的な投資判断（買い/売り/保有）",
  "confidence": "信頼度（高/中/低）",
  "key_points": ["ポイント1", "ポイント2", "ポイント3"],
  "risks": ["リスク1", "リスク2"],
  "recommendation": "推奨アクション"
}

必ずJSON形式のみで返してください。
`;

    const judgeResponse = await openai.chat(judgePrompt, { temperature: 0.2 });

    // JSON を抽出
    let judgeData = null;
    try {
      // JSON部分を抽出（```json ... ``` があれば削除）
      const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgeData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Judge JSON parse failed:', e.message);
      judgeData = {
        final_judgment: 'Analysis Complete',
        confidence: 'medium',
        key_points: ['See candidate responses'],
        risks: [],
        recommendation: 'Review all analyses'
      };
    }

    // 7. 結果統合
    const result = {
      ticker,
      timestamp: new Date().toISOString(),
      mode: 'ai-analysis-with-consensus',
      
      // ステップ1: データ分析
      data_analysis: {
        provider: analysisResult.dataProvider,
        current_price: analysisResult.quote.price,
        currency: analysisResult.quote.currency,
        trend: analysisResult.metrics.trend,
        volatility: analysisResult.metrics.volatility,
        change_pct: analysisResult.metrics.change_pct,
        ma50: analysisResult.metrics.ma50,
        ma200: analysisResult.metrics.ma200
      },

      // ステップ2: LLM分析結果
      ai_analysis: {
        prompt: prompt,
        candidates: candidates.map(c => ({
          provider: c.provider,
          ok: c.ok,
          text: c.text || c.error
        })),
        agreement_ratio: (agreementRatio * 100).toFixed(1)
      },

      // ステップ3: GPT裁定（最終判断）
      consensus: {
        judge: 'gpt-4o-mini',
        judgment: judgeData.final_judgment,
        confidence: judgeData.confidence,
        key_points: judgeData.key_points,
        risks: judgeData.risks,
        recommendation: judgeData.recommendation,
        raw_response: judgeResponse
      },

      // ステップ4: 最終出力
      final_output: {
        ticker,
        decision: judgeData.final_judgment,
        confidence: judgeData.confidence,
        recommendation: judgeData.recommendation
      }
    };

    res.json({
      success: true,
      data: result
    });

  } catch (e) {
    console.error('Stock AI Analysis error:', e);
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
};

// ========== ヘルパー関数: テキスト類似度計算 ==========
function calculateSimilarity(texts) {
  if (texts.length < 2) return 0.5;

  // 簡易的な類似度（単語の重複度）
  const words = texts.map(t => t.toLowerCase().split(/\s+/));
  const intersection = new Set(words[0]).size;
  const union = new Set([...words[0], ...words[1]]).size;
  
  return intersection / union;
}
