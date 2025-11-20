# MAGI System 実装依頼

## 🎯 目的
MAGI System (magi-core) から Cohere を削除し、質問応答システム（5 AI）に特化させる。

---

## 📊 現在の構成

### システム全体
- **magi-core**: 質問応答システム（5 AI: Grok/Gemini/Claude/GPT-4/Mistral）
- **magi-ac**: ドキュメント解析・財務分析（Cohere + データソース）← 今後実装

### 削除対象
- `providers/cohere.js`
- `providers/cohere.js.disabled`
- package.json の `cohere-ai` 依存関係
- server.js の `/api/document/analyze` エンドポイント（存在する場合）

### 保持対象（5 AI）
1. `providers/grok.js` - Grok (BALTHASAR-2)
2. `providers/gemini.js` - Gemini (MELCHIOR-1)
3. `providers/anthropic.js` - Claude (CASPER-3)
4. `providers/openai.js` - GPT-4 (Mary)
5. `providers/mistral.js` - Mistral (Sophia)

---

## 🔧 実装タスク

### タスク1: providers/cohere.js の削除
```bash
rm providers/cohere.js
rm providers/cohere.js.disabled  # 存在する場合
```

### タスク2: providers/gemini.js の確認
**要件**: `chat()` 関数のみを持つ（`analyzeDocument()` は不要）

**期待されるコード構造**:
```javascript
// providers/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function chat(prompt) {
  // 実装
}

module.exports = {
  chat,
};
```

### タスク3: server.js の確認
- `/api/document/analyze` エンドポイントが存在する場合は削除
- 他のエンドポイントは保持:
  - `GET /healthz`
  - `GET /status`
  - `POST /api/consensus`
  - `POST /api/grok/ping`

### タスク4: package.json の更新
```bash
npm uninstall cohere-ai
```

**期待される dependencies**:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.x.x",
    "@google/generative-ai": "^0.x.x",
    "express": "^4.x.x",
    "openai": "^4.x.x"
  }
}
```

**削除**: `"cohere-ai": "..."`

---

## ✅ 検証項目

### 1. ファイル構成
```
magi-system/
├── bootstrap.js
├── server.js
├── package.json
├── providers/
│   ├── grok.js          ✅
│   ├── gemini.js        ✅
│   ├── anthropic.js     ✅
│   ├── openai.js        ✅
│   └── mistral.js       ✅
└── public/
    └── index.html
```

**🚫 存在しないファイル**:
- `providers/cohere.js`
- `providers/cohere.js.disabled`

### 2. API エンドポイント
- `GET /healthz` ✅
- `GET /status` ✅
- `POST /api/consensus` ✅
- `POST /api/grok/ping` ✅
- ~~`POST /api/document/analyze`~~ 🚫 削除

### 3. Secret Manager
**必要な Secret**:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`
- `MISTRAL_API_KEY`

**🚫 不要な Secret**:
- `COHERE_API_KEY`

### 4. 動作確認
```bash
# システム状態確認
TOKEN=$(gcloud auth print-identity-token)
URL="https://magi-app-398890937507.asia-northeast1.run.app"

curl -H "Authorization: Bearer $TOKEN" "$URL/status" | jq .

# 期待される出力
{
  "service": "magi-app",
  "time": "2025-11-20T...",
  "secrets": {
    "OPENAI_API_KEY": true,
    "GEMINI_API_KEY": true,
    "ANTHROPIC_API_KEY": true,
    "XAI_API_KEY": true,
    "MISTRAL_API_KEY": true
  }
}

# 質問応答テスト
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Google CloudとAWSの違いを3点で","meta":{"mode":"integration"}}' \
  "$URL/api/consensus" | jq '{final: .final[:200], sophia: .sophia}'
```

---

## 📦 デプロイコマンド

```bash
cd ~/Desktop/magi-sys

# 依存関係から cohere-ai を削除
npm uninstall cohere-ai

# Git commit & push
git add -A
git commit -m "refactor: Cohere を magi-ac に移行、magi-core は質問応答（5 AI）に特化"
git push origin main

# Cloud Run デプロイ
gcloud run deploy magi-app \
  --region=asia-northeast1 \
  --source . \
  --set-secrets \
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,\
XAI_API_KEY=XAI_API_KEY:latest,\
MISTRAL_API_KEY=MISTRAL_API_KEY:latest \
  --set-env-vars \
ANTHROPIC_MODEL=claude-sonnet-4-20250514,\
GEMINI_MODEL=gemini-2.5-flash,\
XAI_MODEL=grok-2,\
OPENAI_MODEL=gpt-4o-mini,\
MISTRAL_MODEL=mistral-medium-latest,\
MISTRAL_BASE_URL=https://api.mistral.ai/v1,\
XAI_BASE_URL=https://api.x.ai/v1
```

---

## 🎯 成功基準

- [ ] `providers/cohere.js` が削除されている
- [ ] `providers/gemini.js` に `analyzeDocument()` が存在しない
- [ ] `server.js` に `/api/document/analyze` が存在しない
- [ ] package.json に `cohere-ai` が存在しない
- [ ] `/status` エンドポイントで 5つの Secret が true
- [ ] `/api/consensus` が正常に動作する
- [ ] Cloud Run デプロイが成功する

---

## 📌 重要事項

1. **システム分離**:
   - **magi-core**: 質問応答のみ（5 AI）
   - **magi-ac**: ドキュメント解析（Cohere）← 別リポジトリで今後実装

2. **削除の理由**:
   - Cohere (Isabel) は magi-ac で担当
   - magi-core は質問応答に特化
   - システムの責任分離を明確化

3. **後方互換性**:
   - 既存の `/api/consensus` エンドポイントは変更なし
   - 5 AI の動作は維持

---

## 🚀 実装手順（ステップバイステップ）

### Step 1: 現状確認
```bash
cd ~/Desktop/magi-sys
ls -la providers/
cat package.json | jq '.dependencies'
```

### Step 2: Cohere 関連ファイル削除
```bash
# Cohere プロバイダー削除
rm -f providers/cohere.js
rm -f providers/cohere.js.disabled

# 確認
ls providers/
```

### Step 3: package.json から cohere-ai を削除
```bash
npm uninstall cohere-ai
```

### Step 4: server.js の確認と修正
```bash
# /api/document/analyze エンドポイントを検索
grep -n "document/analyze" server.js

# 存在する場合は削除（手動編集が必要）
```

### Step 5: providers/gemini.js の確認
```bash
# analyzeDocument 関数が存在するか確認
grep -n "analyzeDocument" providers/gemini.js

# 存在する場合は削除（手動編集が必要）
```

### Step 6: テスト実行
```bash
# ローカルテスト
node bootstrap.js

# 別ターミナルで
curl http://localhost:8080/healthz
```

### Step 7: Git commit & push
```bash
git add -A
git commit -m "refactor: Remove Cohere, focus on Q&A system with 5 AIs"
git push origin main
```

### Step 8: Cloud Run デプロイ
```bash
gcloud run deploy magi-app \
  --region=asia-northeast1 \
  --source . \
  --set-secrets \
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,\
XAI_API_KEY=XAI_API_KEY:latest,\
MISTRAL_API_KEY=MISTRAL_API_KEY:latest
```

### Step 9: デプロイ後確認
```bash
TOKEN=$(gcloud auth print-identity-token)
URL="https://magi-app-398890937507.asia-northeast1.run.app"

curl -H "Authorization: Bearer $TOKEN" "$URL/status" | jq .
```

---

以上の指示に従って、magi-core から Cohere を完全に削除し、質問応答システム（5 AI）に特化させてください。
