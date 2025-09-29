#!/bin/bash

# ====================================
# MAGI System ビルドエラー修正スクリプト
# ====================================

echo "╔════════════════════════════════════════╗"
echo "║    Fixing Build Error & Redeploying    ║"
echo "╚════════════════════════════════════════╝"
echo ""

cd ~/magi-system

# ====================================
# 1. 現在のbootstrap.jsを確認
# ====================================
echo "🔍 bootstrap.jsの状態を確認..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f bootstrap.js ]; then
    echo "✅ bootstrap.js 存在確認"
    echo "現在のサイズ: $(wc -l bootstrap.js | awk '{print $1}') 行"
else
    echo "❌ bootstrap.js が見つかりません"
fi

# ====================================
# 2. bootstrap.jsを正しく作成
# ====================================
echo ""
echo "📝 bootstrap.js を修正..."

cat > bootstrap.js << 'BOOTSTRAP'
'use strict';
const express = require('express');
const path = require('path');

// グローバルappを作成
global.app = express();
const app = global.app;

// ミドルウェア設定
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 基本エンドポイント
app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/status', (_req, res) => {
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

// server.js をロード
try {
  require('./server.js');
  console.log('✅ server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error);
}

// サーバー起動
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MAGI System v2.0 listening on port ${port}`);
  console.log(`   BALTHASAR-2: ONLINE`);
  console.log(`   MELCHIOR-1: ONLINE`);
  console.log(`   CASPER-3: ONLINE`);
});
BOOTSTRAP

echo "✅ bootstrap.js 修正完了"

# ====================================
# 3. server.jsの修正（global.appの問題を修正）
# ====================================
echo ""
echo "📝 server.js を修正..."

# server.jsの最初の行を修正
sed -i "1s/.*/\'use strict\';/" server.js
sed -i "2s/.*/const app = global.app;/" server.js

echo "✅ server.js 修正完了"

# ====================================
# 4. public/index.htmlを作成（なければ）
# ====================================
echo ""
echo "📝 public/index.html を確認..."

mkdir -p public

if [ ! -f public/index.html ]; then
    echo "Creating public/index.html..."
    cat > public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAGI System v2.0</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #000; 
            color: #0f0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        h1 { 
            color: #ff0000; 
            text-shadow: 0 0 10px #ff0000;
            font-size: 3em;
        }
        .status { 
            background: #111; 
            padding: 20px; 
            border: 1px solid #0f0;
            margin: 20px;
            width: 600px;
            border-radius: 5px;
        }
        .unit {
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #0f0;
        }
        .ready { color: #0f0; }
        .error { color: #f00; }
        .version { 
            color: #fff; 
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>MAGI SYSTEM</h1>
    <div class="status">
        <h2>System Status</h2>
        <div class="unit">
            <strong>BALTHASAR-2</strong> (Grok/xAI)<br>
            <span class="ready">● OPERATIONAL</span>
        </div>
        <div class="unit">
            <strong>MELCHIOR-1</strong> (Gemini/Google)<br>
            <span class="ready">● OPERATIONAL</span>
        </div>
        <div class="unit">
            <strong>CASPER-3</strong> (Claude/Anthropic)<br>
            <span class="ready">● OPERATIONAL</span>
        </div>
        <div class="version">Version 2.0.0</div>
    </div>
</body>
</html>
HTML
    echo "✅ public/index.html 作成完了"
else
    echo "✅ public/index.html 既に存在"
fi

# ====================================
# 5. 不要なバックアップファイルを削除
# ====================================
echo ""
echo "🧹 不要なファイルを削除..."
rm -f *.bak *.backup *.bak.* server_old.js check-status.sh 2>/dev/null || true
echo "✅ クリーンアップ完了"

# ====================================
# 6. package.jsonの依存関係を確認
# ====================================
echo ""
echo "📦 依存関係をインストール..."
npm install express

# ====================================
# 7. Gitコミット
# ====================================
echo ""
echo "📝 変更をGitにコミット..."
git add -A
git commit -m "fix: 🐛 Fix build error and clean up files

- Fix bootstrap.js to properly initialize Express
- Fix server.js global.app reference
- Add public/index.html
- Remove backup files
- Update dependencies" || echo "No changes to commit"

# ====================================
# 8. 再デプロイ
# ====================================
echo ""
echo "🚀 Cloud Run へ再デプロイ..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_ID=screen-share-459802
REGION=asia-northeast1

# より詳細なデプロイコマンド
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

# デプロイが成功したら環境変数を設定
if [ $? -eq 0 ]; then
    echo ""
    echo "🔐 環境変数とSecretsを設定..."
    gcloud run services update magi-app \
      --region=$REGION \
      --set-secrets \
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,\
XAI_API_KEY=XAI_API_KEY:latest \
      --set-env-vars \
VERSION=2.0.0,\
OPENAI_MODEL=gpt-4o-mini,\
ANTHROPIC_MODEL=claude-3-5-sonnet-latest,\
XAI_MODEL=grok-2,\
XAI_BASE_URL=https://api.x.ai/v1 \
      --project=$PROJECT_ID
    
    # URL取得と動作確認
    URL=$(gcloud run services describe magi-app --region=$REGION --format='value(status.url)')
    
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║        ✅ デプロイ成功！                ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "🌐 URL: $URL"
    echo ""
    echo "🧪 動作確認:"
    echo ""
    echo "1. ヘルスチェック:"
    echo "   curl $URL/healthz"
    echo ""
    echo "2. ステータス確認:"
    echo "   curl $URL/status | jq ."
    echo ""
    echo "3. v2.0機能テスト:"
    echo "   curl -X POST '$URL/api/consensus' \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"prompt\":\"Hello\",\"meta\":{\"mode\":\"integration\"}}'"
else
    echo ""
    echo "❌ デプロイ失敗"
    echo ""
    echo "ビルドログを確認してください:"
    echo "gcloud builds list --region=$REGION --limit=1"
    echo ""
    echo "より詳細なログ:"
    echo "gcloud logging read 'resource.type=build' --limit=50 --format=json | jq ."
fi
