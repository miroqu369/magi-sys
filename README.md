# Magi System

Google Cloud Run上で稼働する合議型LLMシステム

## 概要
3つのLLMエンジン（Grok, Gemini, Claude）から回答を取得し、GPT(OpenAI)が裁定して最終応答を返す合議システム。

## アーキテクチャ
- プロバイダー: Grok (xAI), Gemini (Google), Claude (Anthropic)
- 裁定役 (Mary): GPT (OpenAI)
- プラットフォーム: Google Cloud Run

## デプロイ完了
現在稼働中のシステム
