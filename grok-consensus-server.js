// MAGIシステム - 各AIクライアントのインポートと初期化
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const OpenAI = require('openai');

// 環境変数からAPIキーを読み込む
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// APIキーの存在チェック (本番環境で重要)
if (!geminiApiKey || !groqApiKey || !openaiApiKey) {
  console.warn('警告: 1つ以上のAPIキーが環境変数に設定されていません。');
}

// 各AIクライアントのインスタンスを作成
const genAI = new GoogleGenerativeAI(geminiApiKey);
const groq = new Groq({ apiKey: groqApiKey });
const openai = new OpenAI({ apiKey: openaiApiKey });

/**
 * 3人の賢者（AI）による合議を行う関数
 * @param {string} question ユーザーからの質問
 * @returns {Promise<object>} 各AIの回答を含むオブジェクト
 */
async function performConsensus(question) {
  // 各AIへの役割（ペルソナ）を定義したシステムプロンプト
  const melchiorPrompt = `
    あなたは科学者MELCHIORです。提供された質問に対して、科学的データ、統計、論理的根拠にのみ基づいて、客観的かつ冷静に分析し、結論を述べてください。感情や主観、未証明の憶測は完全に排除してください。
    質問: "${question}"
  `;
  const balthasarPrompt = `
    あなたは創造者BALTHASARです。提供された質問に対して、従来の枠組みを超えた独創的かつ革新的な視点、あるいは哲学的な洞察を用いて回答してください。常識にとらわれない自由な発想を重視します。
    質問: "${question}"
  `;
  const casperPrompt = `
    あなたは共感者CASPERです。提供された質問に対して、人間の心理、感情、倫理、道徳的な側面を最重視して回答してください。共感と直感を活かし、人間的な視点からの意見を述べてください。
    質問: "${question}"
  `;

  try {
    // 各AIへのリクエストを並列実行
    const [melchiorResponse, balthasarResponse, casperResponse] = await Promise.all([
      // MELCHIOR (Gemini)
      genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' }).generateContent(melchiorPrompt),
      // BALTHASAR (Grok - Llama3 70b)
      groq.chat.completions.create({ messages: [{ role: 'user', content: balthasarPrompt }], model: 'llama3-70b-8192' }),
      // CASPER (Claude) -> OpenAIに切り替え
      openai.chat.completions.create({ messages: [{ role: 'user', content: casperPrompt }], model: 'gpt-4o' })
    ]);

    // 各AIからのレスポンスを整形して返す
    return {
      melchior: melchiorResponse.response.text(),
      balthasar: balthasarResponse.choices[0]?.message?.content || '（回答なし）',
      casper: casperResponse.choices[0]?.message?.content || '（回答なし）',
    };
  } catch (error) {
    console.error('MAGI合議中にエラーが発生しました:', error);
    // エラーが発生した場合は、その旨を返す
    throw new Error('合議処理中に内部エラーが発生しました。');
  }
}
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.json());

// OpenAIによる最終判断システム
async function openAIFinalJudgment(question, magiResponses) {
  const finalJudgmentPrompt = `
MAGI三賢者システム 合議結果の最終判断

対象質問: ${question}

各MAGI合議者の分析:

【MELCHIOR (Gemini - 科学・論理)】
${magiResponses.melchior}

【BALTHASAR (Grok - 創造・革新)】
${magiResponses.balthasar}

【CASPER (Claude/OpenAI - 人間・感情)】
${magiResponses.casper}

あなたは最終判断を下すAIです。上記三者の合議結果を総合的に評価し、最終的な判断を下してください。各合議者の異なる視点（科学性、創造性、人間性）を統合し、最も合理的で包括的な結論を導いてください。
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: finalJudgmentPrompt }],
      model: 'gpt-4o', // OpenAIの最新モデルを利用
    });
    return completion.choices[0]?.message?.content || '（最終判断なし）';
  } catch (error) {
    console.error('OpenAI最終判断中にエラーが発生しました:', error);
    throw new Error('最終判断処理中に内部エラーが発生しました。');
  }
}


// メインのクエリ処理
app.post('/api/query', async (req, res) => {
    const { question } = req.body;
    if (!question) {
        return res.status(400).json({ error: '質問が指定されていません。' });
    }

    try {
        console.log(`MAGI Consensus System Query: ${question}`);

        // ★★★ 新しい合議関数を呼び出す ★★★
        const magiResponses = await performConsensus(question);

        // OpenAI GPTによる最終統合判断
        const finalAnswer = await openAIFinalJudgment(question, magiResponses);

        res.json({
            question,
            responses: magiResponses,
            finalAnswer,
            metadata: {
                timestamp: new Date().toISOString(),
                system: 'MAGI Consensus + OpenAI Judgment',
                melchior: 'Gemini - Scientific Consensus',
                balthasar: 'Grok - Creative Consensus',
                casper: 'Claude/OpenAI - Human Consensus',
                finalJudge: 'OpenAI GPT-4o Integration',
                architecture: 'Three-Way Consensus → Single Judge'
            }
        });

    } catch (error) {
        console.error('MAGI System Error:', error);
        res.status(500).json({
            error: 'MAGI CONSENSUS SYSTEM MALFUNCTION',
            message: error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`┌─────────────────────────────────────┐`);
    console.log(`│   MAGI CONSENSUS SYSTEM ACTIVE      │`);
    console.log(`│   Three Advisors + One Judge        │`);
    console.log(`├─────────────────────────────────────┤`);
    console.log(`│ MELCHIOR  : Gemini (Science)        │`);
    console.log(`│ BALTHASAR : Grok (Creativity)       │`);
    console.log(`│ CASPER    : Claude/OpenAI (Humanity)│`);
    console.log(`│ JUDGE     : OpenAI GPT (Final)      │`);
    console.log(`├─────────────────────────────────────┤`);
    console.log(`│ PORT: ${PORT}                          │`);
    console.log(`│ MODE: Consensus → Judgment          │`);
    console.log(`└─────────────────────────────────────┘`);
});
