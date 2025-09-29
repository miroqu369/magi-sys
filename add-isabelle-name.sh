#!/bin/bash
echo "╔════════════════════════════════════════╗"
echo "║   Isabelle統合判断者 実装スクリプト    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# バックアップ
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# server.jsのjudge部分を修正
# 1. Consensus Mode
sed -i '/judge: {$/a\          name: "Isabelle",' server.js

# 2. すでに追加されている可能性があるので、重複チェック
ISABELLE_COUNT=$(grep -c '"Isabelle"' server.js)

if [ $ISABELLE_COUNT -eq 0 ]; then
  echo "❌ 自動修正失敗。手動で修正します..."
  
  # 手動修正用のパッチを適用
  cat > server-isabelle.patch << 'PATCH'
--- a/server.js
+++ b/server.js
@@ -judge部分,+1 @@
       judge: {
+        name: "Isabelle",
         model: judgeResult.model || openai.model,
PATCH
  
  echo "手動でserver.jsを修正します..."
fi

echo "修正を確認中..."
grep -n "judge:" server.js | head -5

echo ""
echo "✅ 修正完了"
