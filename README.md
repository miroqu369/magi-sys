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

## UI Update (2025-09-29)
- MAGI System visual interface implemented
- Eva-style design with authentic NERV aesthetics
- Real-time status display for all three AI units
