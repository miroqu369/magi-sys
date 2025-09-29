#!/bin/bash

# ====================================
# MAGI System URL確認と動作テスト
# ====================================

echo "╔════════════════════════════════════════╗"
echo "║     MAGI System URL Verification       ║"
echo "╚════════════════════════════════════════╝"
echo ""

PROJECT_ID=screen-share-459802
REGION=asia-northeast1

# 現在のCloud Run URLを取得
echo "🔍 Cloud Run サービスの正しいURLを取得中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 正確なURL取得
URL=$(gcloud run services describe magi-app \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)')

echo "✅ 正しいURL: $URL"
echo ""

# 両方のURLをテスト
echo "📊 URL確認テスト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 新しいURL（正しいはず）
NEW_URL="https://magi-app-398890937507.asia-northeast1.run.app"
OLD_URL="https://magi-app-dtrah63zyq-an.a.run.app"

echo ""
echo "1️⃣ 公式URL ($URL) をテスト:"
echo "----------------------------------------"
echo "Healthz:"
curl -s "$URL/healthz" -w "\nHTTP Status: %{http_code}\n" | head -1
echo ""
echo "Status:"
curl -s "$URL/status" | jq -r '.version, .service' 2>/dev/null || echo "Status取得失敗"

echo ""
echo "2️⃣ 新形式URL ($NEW_URL) をテスト:"
echo "----------------------------------------"
echo "Healthz:"
curl -s "$NEW_URL/healthz" -w "\nHTTP Status: %{http_code}\n" | head -1
echo ""
echo "Status:"
curl -s "$NEW_URL/status" | jq -r '.version, .service' 2>/dev/null || echo "Status取得失敗"

echo ""
echo "3️⃣ 旧形式URL ($OLD_URL) をテスト:"
echo "----------------------------------------"
echo "Healthz:"
curl -s "$OLD_URL/healthz" -w "\nHTTP Status: %{http_code}\n" | head -1

# 正しいURLを環境変数として設定
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 動作するURLを使用してください:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "export MAGI_URL=\"$URL\""
echo ""
echo "🧪 テストコマンド:"
echo ""
echo "# ヘルスチェック"
echo "curl \$MAGI_URL/healthz"
echo ""
echo "# ステータス確認"
echo "curl \$MAGI_URL/status | jq ."
echo ""
echo "# Integration Mode テスト"
echo "curl -X POST \"\$MAGI_URL/api/consensus\" \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"prompt\":\"こんにちは\",\"meta\":{\"mode\":\"integration\"}}'"

# サービスの詳細情報
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 サービス詳細情報"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud run services describe magi-app \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(
    status.url,
    status.latestReadyRevisionName,
    status.traffic[].percent
  )"

# 最新のリビジョンログを確認
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 最新リビジョンのログ (最初の10行)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=magi-app" \
  --limit=10 \
  --format="value(textPayload)" \
  --project=$PROJECT_ID 2>/dev/null | head -10 || echo "ログ取得失敗"
