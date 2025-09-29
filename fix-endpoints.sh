#!/bin/bash

# ====================================
# MAGI System エンドポイント修正スクリプト
# ====================================

echo "╔════════════════════════════════════════╗"
echo "║    Fixing MAGI System Endpoints        ║"
echo "╚════════════════════════════════════════╝"
echo ""

cd ~/magi-system

# ====================================
# 1. 現在のbootstrap.jsを確認
# ====================================
echo "🔍 現在のbootstrap.jsを確認..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最初の20行:"
head -20 bootstrap.js
echo ""

# ====================================
# 2. bootstrap.jsを完全に作り直し
# ====================================
echo "📝 bootstrap.jsを完全に作り直し..."

cat > bootstrap.js << 'BOOTSTRAP'
'use strict';
const express = require('express');
const path = require('path');

// Express アプリケーション作成
const app = express();

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ヘルスチェックエンドポイント（最重要）
app.get('/healthz', (req, res) => {
  console.log('Healthz endpoint called');
  res.status(200).send('ok');
});

// ステータスエンドポイント
app.get('/status', (req, res) => {
  console.log('Status endpoint called');
  res.json({
    service: 'magi-system',
    version: '2.0.0',
    time: new Date().toISOString(),
    status: 'OPERATIONAL',
    secrets: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      XAI_API_KEY: !!process.env.XAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
    },
    magi_units: {
      'BALTHASAR-2': 'READY',
      'MELCHIOR-1': 'READY',
      'CASPER-3': 'READY'
    }
  });
});

// ルートパス
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// グローバルに設定（server.jsで使用）
global.app = app;

// server.js をロード（APIエンドポイント追加）
try {
  require('./server.js');
  console.log('✅ server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error.message);
}

// 404ハンドラー（最後に追加）
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.path,
    version: '2.0.0'
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    version: '2.0.0'
  });
});

// サーバー起動
const port = process.env.PORT || 8080;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MAGI System v2.0 listening on port ${port}`);
  console.log(`   BALTHASAR-2: ONLINE`);
  console.log(`   MELCHIOR-1: ONLINE`);
  console.log(`   CASPER-3: ONLINE`);
  console.log(`   Available endpoints:`);
  console.log(`   - GET  /healthz`);
  console.log(`   - GET  /status`);
  console.log(`   - GET  /`);
  console.log(`   - POST /api/consensus`);
  console.log(`   - POST /api/grok/ping`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
BOOTSTRAP

echo "✅ bootstrap.js 修正完了"

# ====================================
# 3. ローカルテスト
# ====================================
echo ""
echo "🧪 ローカルでテスト実行（10秒間）..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# バックグラウンドでサーバー起動
timeout 10 node bootstrap.js &
SERVER_PID=$!

# サーバーが起動するまで待機
sleep 3

# ローカルテスト
echo ""
echo "ローカルテスト結果:"
echo "Healthz: $(curl -s http://localhost:8080/healthz)"
echo "Status: $(curl -s http://localhost:8080/status | jq -r '.version, .status' | tr '\n' ' ')"

# サーバー停止を待つ
wait $SERVER_PID 2>/dev/null

echo ""
echo "✅ ローカルテスト完了"

# ====================================
# 4. Gitコミットと再デプロイ
# ====================================
echo ""
echo "📝 変更をGitにコミット..."
git add bootstrap.js
git commit -m "fix: 🐛 Fix healthz and status endpoints

- Recreate bootstrap.js with proper Express setup
- Fix endpoint registration order
- Add proper error handling
- Add request logging for debugging" || echo "No changes to commit"

echo ""
echo "🚀 Cloud Runへ再デプロイ..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_ID=screen-share-459802
REGION=asia-northeast1

gcloud run deploy magi-app \
  --region=$REGION \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --max-instances=10 \
  --min-instances=0 \
  --port=8080 \
  --project=$PROJECT_ID \
  --quiet

if [ $? -eq 0 ]; then
    # URL取得
    URL=$(gcloud run services describe magi-app --region=$REGION --format='value(status.url)')
    
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║        ✅ 修正デプロイ完了！           ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "🌐 URL: $URL"
    echo ""
    
    # 30秒待機（サービスが完全に起動するまで）
    echo "⏳ サービスが完全に起動するまで30秒待機..."
    sleep 30
    
    echo ""
    echo "🧪 動作確認:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Healthz テスト:"
    HEALTH=$(curl -s "$URL/healthz")
    echo "   Response: $HEALTH"
    if [ "$HEALTH" = "ok" ]; then
        echo "   ✅ Healthz正常!"
    else
        echo "   ❌ Healthzエラー"
    fi
    
    echo ""
    echo "2. Status テスト:"
    STATUS=$(curl -s "$URL/status")
    VERSION=$(echo $STATUS | jq -r '.version' 2>/dev/null)
    echo "   Version: $VERSION"
    if [ "$VERSION" = "2.0.0" ]; then
        echo "   ✅ Status正常!"
    else
        echo "   ❌ Statusエラー"
    fi
    
    echo ""
    echo "3. APIテスト:"
    API_RESPONSE=$(curl -s -X POST "$URL/api/consensus" \
      -H 'Content-Type: application/json' \
      -d '{"prompt":"Test"}' | jq -r '.version' 2>/dev/null)
    if [ ! -z "$API_RESPONSE" ]; then
        echo "   ✅ API応答あり"
    else
        echo "   ⚠️  API応答なし（APIキーの問題かも）"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 完全なテストコマンド:"
    echo ""
    echo "export MAGI_URL=\"$URL\""
    echo "curl \$MAGI_URL/healthz"
    echo "curl \$MAGI_URL/status | jq ."
else
    echo "❌ デプロイ失敗"
fi
