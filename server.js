'use strict';
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = global.app || express();

// Multer 設定（メモリに一時保存）
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Cloud Storage クライアント
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);

// ドキュメント情報を保存するメモリDB
const documentsDB = {};

console.log('[SERVER] Document analysis module initialized');
console.log('[CONFIG] GCS_BUCKET:', process.env.GCS_BUCKET || 'NOT SET');

// =====================================
// POST /api/documents/upload
// =====================================
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!file || !name) {
      return res.status(400).json({ error: 'ファイルと名前が必須です' });
    }

    console.log(`[UPLOAD] Starting upload: ${file.originalname} (${file.size} bytes)`);

    // ドキュメントID生成
    const docId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const gcsPath = `documents/${docId}${fileExt}`;

    // テキスト抽出
    let extractedText = '';
    
    if (file.mimetype === 'application/pdf') {
      try {
        console.log('[PDF] Parsing PDF...');
        const pdfData = await pdf(file.buffer);
        extractedText = pdfData.text;
        console.log(`[PDF] Extracted ${extractedText.length} characters`);
      } catch (pdfError) {
        console.error('[PDF] Error:', pdfError.message);
        return res.status(400).json({ error: 'PDF解析エラー: ' + pdfError.message });
      }
    } else if (file.mimetype === 'text/plain' || fileExt === '.txt') {
      extractedText = file.buffer.toString('utf-8');
      console.log(`[TEXT] Extracted ${extractedText.length} characters`);
    } else {
      return res.status(400).json({ error: 'PDF またはテキストファイルのみ対応' });
    }

    // Cloud Storage にアップロード（bucket が有効な場合のみ）
    if (bucket) {
      try {
        await bucket.file(gcsPath).save(file.buffer);
        console.log(`[GCS] File saved: gs://${process.env.GCS_BUCKET}/${gcsPath}`);
      } catch (gcsError) {
        console.warn('[GCS] Warning:', gcsError.message);
        // GCS失敗してもメモリDBには保存
      }
    }

    // メモリDBに登録
    documentsDB[docId] = {
      id: docId,
      name: name,
      gcsPath: gcsPath,
      extractedText: extractedText.substring(0, 50000), // 最初の50,000文字
      uploadedAt: new Date().toISOString(),
      fileType: fileExt,
      textLength: extractedText.length
    };

    console.log(`[UPLOAD] ✅ Complete: ${docId}`);
    res.json({ 
      docId: docId, 
      name: name, 
      textLength: extractedText.length,
      gcsPath: gcsPath
    });

  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// GET /api/documents/list
// =====================================
app.get('/api/documents/list', (req, res) => {
  const list = Object.values(documentsDB).map(doc => ({
    id: doc.id,
    name: doc.name,
    uploadedAt: doc.uploadedAt,
    textLength: doc.textLength
  }));
  console.log(`[LIST] Returning ${list.length} documents`);
  res.json(list);
});

// =====================================
// POST /api/documents/analyze
// =====================================
app.post('/api/documents/analyze', async (req, res) => {
  try {
    const { documentId, customPrompt, mode = 'integration' } = req.body;

    const doc = documentsDB[documentId];
    if (!doc) {
      return res.status(404).json({ error: 'ドキュメントが見つかりません' });
    }

    console.log(`[ANALYZE] Starting analysis: ${documentId} (${doc.name})`);

    // プロンプト構築
    const defaultPrompt = `
【決算報告書の自動分析】

以下のドキュメントを詳細に分析してください：

【内容】
${doc.extractedText}

【分析項目】
1. 主要財務指標（売上、営業利益、当期利益など）
2. 前年同期との比較と変動率・理由
3. 事業セグメント別の業績
4. 経営上の課題と認識されているリスク
5. 今後の成長戦略と見通し
6. キャッシュフロー分析
7. 配当政策

【出力形式】
- 具体的な数値を含める
- 理由や背景も含める
- 箇条書きで簡潔に
    `;

    const prompt = customPrompt || defaultPrompt;

    // 既存の /api/consensus エンドポイントに委譲
    console.log(`[ANALYZE] Calling consensus endpoint with mode: ${mode}`);
    
    const consensusURL = `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/consensus`;
    const consensusResponse = await fetch(consensusURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        meta: { mode: mode, temperature: 0.3, timeout_ms: 30000 }
      })
    });

    if (!consensusResponse.ok) {
      throw new Error(`Consensus API error: ${consensusResponse.status}`);
    }

    const result = await consensusResponse.json();
    
    // メタ情報を追加
    result.documentName = doc.name;
    result.documentId = documentId;
    result.analysisType = 'financial_report';
    result.analysisTime = new Date().toISOString();

    console.log(`[ANALYZE] ✅ Complete: ${documentId}`);
    res.json(result);

  } catch (error) {
    console.error('[ANALYZE] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// POST /api/documents/compare
// =====================================
app.post('/api/documents/compare', async (req, res) => {
  try {
    const { doc1Id, doc2Id, mode = 'integration' } = req.body;

    const doc1 = documentsDB[doc1Id];
    const doc2 = documentsDB[doc2Id];

    if (!doc1 || !doc2) {
      return res.status(404).json({ error: 'ドキュメントが見つかりません' });
    }

    console.log(`[COMPARE] Starting comparison: ${doc1.name} vs ${doc2.name}`);

    const comparePrompt = `
【2つの決算報告書の比較分析】

【ドキュメント1: ${doc1.name}】
${doc1.extractedText.substring(0, 15000)}

【ドキュメント2: ${doc2.name}】
${doc2.extractedText.substring(0, 15000)}

【比較分析項目】
1. 売上高・営業利益の増減率
2. 利益率（営業利益率、当期利益率）の推移
3. 事業成長の加速/減速理由
4. 経営戦略の変更点
5. リスク要因の変化
6. 今後の見通し（改善予想 vs 悪化懸念）
7. 市場環境への対応度

【出力形式】
- 数値ベースの比較
- トレンド分析
- 経営品質の相対評価
    `;

    const consensusURL = `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/consensus`;
    const consensusResponse = await fetch(consensusURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: comparePrompt,
        meta: { mode: mode, temperature: 0.3, timeout_ms: 30000 }
      })
    });

    if (!consensusResponse.ok) {
      throw new Error(`Consensus API error: ${consensusResponse.status}`);
    }

    const result = await consensusResponse.json();
    result.comparisonType = 'year_over_year';
    result.doc1 = doc1.name;
    result.doc2 = doc2.name;
    result.comparisonTime = new Date().toISOString();

    console.log(`[COMPARE] ✅ Complete`);
    res.json(result);

  } catch (error) {
    console.error('[COMPARE] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('[SERVER] Ready');
