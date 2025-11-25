#!/bin/bash
echo "════════════════════════════════════════"
echo "   MAGI System 完全修正スクリプト"
echo "════════════════════════════════════════"

PROJECT_ID=screen-share-459802
REGION=asia-northeast1

# 1. 現在のリビジョンとトラフィック確認
echo "📊 現在のトラフィック分散を確認..."
gcloud run services describe magi-app \
  --region=$REGION \
  --format="table(status.traffic.revisionName,status.traffic.percent)"

# 2. 最新リビジョンを取得
LATEST_REVISION=$(gcloud run services describe magi-app \
  --region=$REGION \
  --format='value(status.latestReadyRevisionName)')

echo ""
echo "最新リビジョン: $LATEST_REVISION"
echo ""

# 3. 最新リビジョンに100%トラフィックを割り当て
echo "🔄 最新リビジョンに100%トラフィックを割り当て中..."
gcloud run services update-traffic magi-app \
  --region=$REGION \
  --to-latest

# 4. 正しいURLを取得
URL=$(gcloud run services describe magi-app \
  --region=$REGION \
  --format='value(status.url)')

echo ""
echo "✅ トラフィック更新完了"
echo "URL: $URL"
echo ""

# 5. 30秒待機してコールドスタート完了を待つ
echo "⏳ 30秒待機（コンテナ起動待ち）..."
sleep 30

# 6. テスト実行
echo ""
echo "════════════════════════════════════════"
echo "   動作確認テスト"
echo "════════════════════════════════════════"

echo ""
echo "1. Healthzテスト:"
HEALTH_RESULT=$(curl -s -w "\n%{http_code}" "$URL/healthz")
echo "$HEALTH_RESULT"

echo ""
echo "2. Statusテスト:"
curl -s "$URL/status" | jq .

echo ""
echo "════════════════════════════════════════"
echo "✅ 修正完了！"
echo "MAGI System URL: $URL"
echo "════════════════════════════════════════"
