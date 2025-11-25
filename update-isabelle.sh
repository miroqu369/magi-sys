#!/bin/bash
echo "Isabelleの名前を追加中..."

# server.jsのバックアップ
cp server.js server.js.backup

# judgeレスポンスにnameを追加
sed -i 's/"judge": {/"judge": {\n        "name": "Isabelle",/' server.js

# 確認
echo "修正内容を確認:"
grep -A 5 '"judge":' server.js | head -10

echo ""
echo "修正完了。デプロイしますか？ (y/n)"
