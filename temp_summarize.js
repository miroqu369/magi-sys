
// =====================================
// POST /api/documents/summarize
// =====================================
const GrokSummarizer = require('./analyzers/grok-summarizer');
const MagiClient = require('./analyzers/magi-client');

app.post('/api/documents/summarize', async (req, res) => {
  try {
    const { documentId, language = 'ja', length = 'medium', mode = 'grok' } = req.body;

    const doc = documentsDB[documentId];
    if (!doc) {
      return res.status(404).json({ error: 'ドキュメントが見つかりません' });
    }

    console.log(`[SUMMARIZE] Starting: ${documentId} | Mode: ${mode}`);

    let result = {};

    if (mode === 'grok') {
      // モード1: Grok 単独（高速）
      console.log(`[SUMMARIZE] Using Grok (Fast)`);
      const grokSummarizer = new GrokSummarizer();
      const summary = await grokSummarizer.summarize(
        doc.extractedText,
        `企業決算報告書 | ファイル: ${doc.name}`
      );
      
      result = {
        final: summary,
        documentName: doc.name,
        documentId: documentId,
        analysisType: 'grok_summary',
        model: 'grok-beta',
        summaryLength: length,
        summaryTime: new Date().toISOString()
      };

    } else if (mode === 'magi' || mode === 'integration') {
      // モード2: MAGI 統合（高品質）
      console.log(`[SUMMARIZE] Using MAGI (High Quality)`);
      
      const lengthGuide = {
        short: '100～150文字で',
        medium: '300～500文字で',
        long: '800～1200文字で'
      }[length] || '300～500文字で';

      const summarizePrompt = `
【決算報告書の統合要約】

以下の決算報告書を${lengthGuide}簡潔に要約してください。

【文書内容】
${doc.extractedText.substring(0, 20000)}

【要約項目】
1. 企業概要・事業内容
2. 売上・利益（前年比）
3. 主な経営課題
4. 今後の成長戦略
5. リスク要因

【出力形式】
- 箇条書き形式
- 具体的な数値を含める
- 経営陣のコメントを反映
- 素早く読める構成
      `;

      const consensusURL = `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/consensus`;
      const consensusResponse = await fetch(consensusURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: summarizePrompt,
          meta: { mode: 'integration', temperature: 0.3, timeout_ms: 30000 }
        })
      });

      if (!consensusResponse.ok) {
        throw new Error(`Consensus API error: ${consensusResponse.status}`);
      }

      const consensusResult = await consensusResponse.json();
      
      result = {
        ...consensusResult,
        documentName: doc.name,
        documentId: documentId,
        analysisType: 'magi_summary',
        summaryLength: length,
        summaryTime: new Date().toISOString()
      };

    } else {
      return res.status(400).json({ 
        error: 'mode は grok または magi を選択してください',
        supported: ['grok', 'magi', 'integration']
      });
    }

    console.log(`[SUMMARIZE] ✅ Complete: ${documentId}`);
    res.json(result);

  } catch (error) {
    console.error('[SUMMARIZE] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

