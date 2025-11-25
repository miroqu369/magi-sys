#!/bin/bash
echo "Starting MAGI System on port 8081..."
export PORT=8081
export NODE_ENV=development

# ダミーのAPIキーを設定（ローカルテスト用）
export OPENAI_API_KEY="test-key-local"
export GEMINI_API_KEY="test-key-local"
export XAI_API_KEY="test-key-local"
export ANTHROPIC_API_KEY="test-key-local"

# サーバー起動
node bootstrap.js
