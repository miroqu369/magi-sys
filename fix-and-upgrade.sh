#!/bin/bash

# ====================================
# MAGI System 完全修正＆v2.0実装スクリプト
# ====================================

set -e  # エラーで停止

echo "╔════════════════════════════════════════╗"
echo "║   MAGI System Complete Fix & v2.0      ║"
echo "╚════════════════════════════════════════╝"
echo ""

PROJECT_ID=screen-share-459802
REGION=asia-northeast1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cd ~/magi-core

# ====================================
# STEP 1: Git初期化とGitHub接続
# ====================================
echo "🔧 STEP 1: Git初期化とGitHub接続"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d .git ]; then
    echo "📝 Gitリポジトリを初期化..."
    git init
    
    # Git設定
    git config --global user.email "jun@dogma.jp"
    git config --global user.name "miroqu369"
    
    echo "✅ Git初期化完了"
else
    echo "✅ 既にGit初期化済み"
fi

# .gitignore作成
echo ""
echo "📄 .gitignore を作成..."
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.*

# OS Files
.DS_Store

# IDE
.vscode/
.idea/

# Test files
test-*.sh
check-*.sh
*_old.js

# Backups
backup*/
backups/

# API Keys (重要)
*api_key*
*API_KEY*
secrets/
*.key
GITIGNORE

echo "✅ .gitignore作成完了"

# ====================================
# STEP 2: v2.0実装
# ====================================
echo ""
echo "🚀 STEP 2: v2.0機能実装"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# バックアップ作成
echo "📦 既存ファイルのバックアップ..."
mkdir -p backups/${TIMESTAMP}
cp server.js backups/${TIMESTAMP}/server.js.bak 2>/dev/null || true
cp server_old.js backups/${TIMESTAMP}/server_old.js.bak 2>/dev/null || true

# server.js v2.0作成
echo "📝 server.js v2.0 を作成..."
cat > server.js << 'SERVERJS'
'use strict';
const app = global.app || require('express')();

// プロバイダーをロード
const GrokProvider = require('./providers/grok');
const GeminiProvider = require('./providers/gemini');
const AnthropicProvider = require('./providers/anthropic');
const OpenAIProvider = require('./providers/openai');

const SYSTEM_VERSION = '2.0.0';

// /api/grok/ping - Grok疎通確認
app.post('/api/grok/ping', async (req, res) => {
  try {
    const grok = new GrokProvider();
    await grok.ping();
    const text = await grok.chat('Hello, this is a test. Reply with OK.', { temperature: 0.1 });
    res.json({ ok: true, text, version: SYSTEM_VERSION });
  } catch (error) {
    console.error('Grok ping error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// /api/consensus - 合議エンドポイント（v2.0）
app.post('/api/consensus', async (req, res) => {
  const startTime = Date.now();
  const { prompt, meta = {} } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const temperature = meta.temperature ?? 0.2;
  const timeout_ms = meta.timeout_ms ?? 25000;
  const mode = meta.mode ?? 'consensus';

  console.log(`[MAGI v${SYSTEM_VERSION}] Mode: ${mode.toUpperCase()}, Prompt: "${prompt.substring(0, 50)}..."`);

  try {
    // 3つのAIを並列実行
    const results = await Promise.allSettled([
      executeWithTimeout('grok', () => new GrokProvider().chat(prompt, { temperature }), timeout_ms),
      executeWithTimeout('gemini', () => new GeminiProvider().chat(prompt, { temperature }), timeout_ms),
      executeWithTimeout('claude', () => new AnthropicProvider().chat(prompt, { temperature }), timeout_ms)
    ]);

    const candidates = results.map((result, idx) => {
      const providers = ['grok', 'gemini', 'claude'];
      const magi_names = ['BALTHASAR-2', 'MELCHIOR-1', 'CASPER-3'];
      const roles = ['創造的・革新的分析', '論理的・科学的分析', '人間的・感情的分析'];
      
      if (result.status === 'fulfilled') {
        return {
          provider: providers[idx],
          magi_unit: magi_names[idx],
          role: roles[idx],
          ok: true,
          text: result.value
        };
      } else {
        return {
          provider: providers[idx],
          magi_unit: magi_names[idx],
          role: roles[idx],
          ok: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // 一致度計算
    const validTexts = candidates.filter(c => c.ok).map(c => c.text);
    const agreementRatio = calculateAgreement(validTexts);
    
    let finalAnswer;
    let judgeInfo = null;
    let synthesisMethod = null;

    // モード別処理
    switch(mode) {
      case 'integration':
        console.log(`[GPT-4 Integration Mode]`);
        const integrationResult = await integrateWithGPT(prompt, candidates);
        finalAnswer = integrationResult.final;
        judgeInfo = {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          reason: integrationResult.reason,
          method: 'integration',
          decision: 'INTEGRATED',
          insights: integrationResult.insights
        };
        synthesisMethod = 'gpt_integration';
        break;

      case 'synthesis':
        console.log(`[Advanced Synthesis Mode]`);
        const synthesisResult = await synthesizeResponses(prompt, candidates);
        finalAnswer = synthesisResult.final;
        judgeInfo = {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          reason: synthesisResult.reason,
          method: 'synthesis',
          insights: synthesisResult.insights,
          decision: 'SYNTHESIZED'
        };
        synthesisMethod = 'advanced_synthesis';
        break;

      case 'consensus':
      default:
        if (agreementRatio >= 0.66) {
          console.log(`[Consensus Reached: ${(agreementRatio * 100).toFixed(1)}%]`);
          finalAnswer = validTexts[0] || 'No valid responses';
          judgeInfo = { 
            model: 'consensus', 
            reason: `合議により一致度${(agreementRatio * 100).toFixed(1)}%で合意`,
            decision: 'APPROVED'
          };
          synthesisMethod = 'majority_consensus';
        } else {
          console.log(`[GPT-4 Arbitration Required]`);
          const openai = new OpenAIProvider();
          const judgeResult = await openai.judge(prompt, candidates);
          finalAnswer = judgeResult.final;
          judgeInfo = {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            reason: judgeResult.reason,
            winner: judgeResult.winner,
            decision: 'ARBITRATED'
          };
          synthesisMethod = 'gpt_arbitration';
        }
    }

    const totalTime = Date.now() - startTime;
    
    res.json({
      version: SYSTEM_VERSION,
      final: finalAnswer,
      mode: mode,
      judge: judgeInfo,
      candidates,
      metrics: {
        agreement_ratio: agreementRatio,
        response_time_ms: totalTime,
        synthesis_method: synthesisMethod,
        valid_responses: validTexts.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Consensus error:', error);
    res.status(500).json({ 
      error: error.message,
      version: SYSTEM_VERSION 
    });
  }
});

// GPT-4統合関数
async function integrateWithGPT(originalPrompt, candidates) {
  const openai = new OpenAIProvider();
  
  const integrationPrompt = `あなたはMAGIシステムの最終統合判断を行うGPT-4です。
【元の質問】${originalPrompt}
【3つのMAGIユニットの回答】
${candidates.map(c => `${c.magi_unit} (${c.role}): ${c.ok ? c.text : '[エラー]'}`).join('\n---\n')}
【統合タスク】各回答の長所を活かし、包括的な回答を生成してください。
【出力形式】必ず以下のJSON形式で回答:
{"final": "統合された最終回答", "reason": "統合の根拠", "insights": ["洞察1", "洞察2"]}`;

  try {
    const response = await openai.chat(integrationPrompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Integration parse error:', e);
  }
  
  return {
    final: response || 'Integration failed',
    reason: "GPT-4による統合判断",
    insights: []
  };
}

// 高度な合成関数
async function synthesizeResponses(originalPrompt, candidates) {
  const openai = new OpenAIProvider();
  
  const synthesisPrompt = `あなたはMAGIシステムの高度な合成判断を行うGPT-4です。
【元の質問】${originalPrompt}
【3つのMAGIユニットの分析】
${candidates.map(c => `${c.magi_unit}: ${c.ok ? c.text : '[エラー]'}`).join('\n---\n')}
【創発的合成タスク】各ユニットの特性を融合させ、創発的な回答を生成。
【出力形式】必ず以下のJSON形式で回答:
{"final": "合成された回答", "reason": "合成プロセス", "insights": {"creative": "創造的洞察", "logical": "論理的洞察", "emotional": "感情的洞察"}}`;

  try {
    const response = await openai.chat(synthesisPrompt, { temperature: 0.4 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Synthesis parse error:', e);
  }
  
  return {
    final: response || 'Synthesis failed',
    reason: "高度な合成による判断",
    insights: {}
  };
}

// ユーティリティ関数
async function executeWithTimeout(name, fn, timeout) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

function calculateAgreement(texts) {
  if (texts.length < 2) return 0;
  
  const tokenize = (text) => text.toLowerCase().split(/\s+/);
  const tokens = texts.map(tokenize);
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const set1 = new Set(tokens[i]);
      const set2 = new Set(tokens[j]);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      totalSimilarity += intersection.size / union.size;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

console.log('✅ MAGI v2.0 server module loaded');
module.exports = app;
SERVERJS

# package.json更新
echo "📝 package.json を v2.0 に更新..."
cat > package.json << 'PACKAGEJSON'
{
  "name": "magi-core",
  "version": "2.0.0",
  "description": "MAGI Consensus LLM System with GPT Integration Modes",
  "main": "bootstrap.js",
  "scripts": {
    "start": "node bootstrap.js",
    "test": "curl http://localhost:8080/status"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@google-cloud/secret-manager": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/miroqu369/magi-core.git"
  },
  "author": "miroqu369",
  "license": "MIT"
}
PACKAGEJSON

# README作成
echo "📝 README.md を作成..."
cat > README.md << 'README'
# 🎯 MAGI System v2.0

エヴァンゲリオンのMAGIシステムにインスパイアされた合議制AI

## システム構成

- **BALTHASAR-2** (Grok/xAI) - 創造的・革新的分析
- **MELCHIOR-1** (Gemini/Google) - 論理的・科学的分析
- **CASPER-3** (Claude/Anthropic) - 人間的・感情的分析
- **GPT-4** (OpenAI) - 最終裁定

## v2.0 新機能

### 3つの動作モード

1. **Consensus Mode** (デフォルト)
   - 66%一致で合意
   - 不一致時はGPT-4裁定

2. **Integration Mode** 
   - GPT-4が常に全回答を統合
   - 包括的で洗練された回答

3. **Synthesis Mode**
   - 創発的な合成
   - 各AIの特性を最大限活用

## API使用例

```bash
# Consensus Mode
curl -X POST https://magi-app-dtrah63zyq-an.a.run.app/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"prompt": "質問"}'

# Integration Mode  
curl -X POST https://magi-app-dtrah63zyq-an.a.run.app/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"prompt": "質問", "meta": {"mode": "integration"}}'

# Synthesis Mode
curl -X POST https://magi-app-dtrah63zyq-an.a.run.app/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"prompt": "質問", "meta": {"mode": "synthesis"}}'
```
README

echo "✅ v2.0実装完了"

# ====================================
# STEP 3: Git初回コミット
# ====================================
echo ""
echo "📦 STEP 3: Git初回コミット"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 全ファイルを追加
git add -A

# 初回コミット
git commit -m "🚀 feat: MAGI System v2.0 - Complete implementation

- Add Integration and Synthesis modes
- Fix bootstrap.js healthz endpoint
- Add comprehensive error handling
- Update all providers with proper error handling
- Add README documentation" || echo "Already committed"

# GitHubリモート設定
echo ""
echo "🌐 GitHubリモートを設定..."
git remote add origin https://github.com/miroqu369/magi-core.git 2>/dev/null || {
    echo "リモート既存のため更新..."
    git remote set-url origin https://github.com/miroqu369/magi-core.git
}

echo "✅ Git設定完了"

# ====================================
# STEP 4: Cloud Runへデプロイ
# ====================================
echo ""
echo "☁️ STEP 4: Cloud Runへデプロイ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "🚀 Cloud Runへデプロイ開始..."
gcloud run deploy magi-app \
  --region=$REGION \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --max-instances=10 \
  --project=$PROJECT_ID

# 環境変数とSecrets設定
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

# ====================================
# STEP 5: 動作確認
# ====================================
echo ""
echo "🧪 STEP 5: 動作確認"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

URL=$(gcloud run services describe magi-app --region=$REGION --format='value(status.url)')

echo "📡 デプロイ完了！"
echo "🌐 URL: $URL"
echo ""

# ヘルスチェック
echo "Testing /healthz..."
curl -sS "$URL/healthz"
echo ""
echo ""

# ステータス確認
echo "Testing /status..."
curl -sS "$URL/status" | jq . || echo "jqがインストールされていません"

# ====================================
# 完了
# ====================================
echo ""
echo "╔════════════════════════════════════════╗"
echo "║     ✅ 完全修正＆v2.0実装完了！        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📊 システム状態:"
echo "  - バージョン: v2.0.0"
echo "  - Git: 初期化済み、GitHub接続済み"
echo "  - Cloud Run: デプロイ済み"
echo "  - URL: $URL"
echo ""
echo "🎯 次のステップ:"
echo ""
echo "1. GitHubへプッシュ (初回):"
echo "   git branch -M main"
echo "   git push -u origin main --force"
echo ""
echo "2. v2.0モードテスト:"
echo "   # Integration Mode"
echo "   curl -X POST '$URL/api/consensus' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"prompt\":\"AIの未来\",\"meta\":{\"mode\":\"integration\"}}'"
echo ""
echo "3. 継続的な更新:"
echo "   git add -A && git commit -m 'update' && git push"
echo "   gcloud run deploy magi-app --source . --region=$REGION"
