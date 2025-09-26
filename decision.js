
/* === Mary strict judge prompt (userPrompt is reference-only) === */
function buildMaryPromptReferenceOnly(userPrompt, responses, metrics = {}) {
  const lines = responses.map(r => `- ${r.name}: ${r.text}`).join('\n');
  return `
あなたは「Mary」という審判です。あなたの唯一の役割は、下記の候補回答のみを根拠に、中立に最終結論を採択することです。
禁止: あなた自身の新情報・独自意見の追加、裏取りのない推測。
許可: 候補の要点統合（候補内の内容に限定）。ユーザー質問は参照用であり、結論は必ず候補回答の範囲から選択／統合してください。

【参考（質問文。参照のみ／根拠化禁止）】
${userPrompt || '(なし)'}

【候補回答（根拠として使用可）】
${lines}

【参考メトリクス（任意参照）】
- 合意率: ${metrics.agreementRatio ?? 'N/A'}
- エントロピー: ${metrics.entropy ?? 'N/A'}

出力は必ず JSON のみ:
{
 "final_answer": "...",            // 候補から選択 or 候補内の要点を統合
 "reason": "...",                  // どの候補のどの根拠か（候補名を明記）
 "confidence": "high|medium|low"
}
`.trim();
}

/* === Mary strict judge prompt (userPrompt is reference-only) === */
function buildMaryPromptReferenceOnly(userPrompt, responses, metrics = {}) {
  const lines = responses.map(r => `- ${r.name}: ${r.text}`).join('\n');
  return `
あなたは「Mary」という審判です。あなたの唯一の役割は、下記の候補回答のみを根拠に、中立に最終結論を採択することです。
禁止: あなた自身の新情報・独自意見の追加、裏取りのない推測。
許可: 候補の要点統合（候補内の内容に限定）。ユーザー質問は参照用であり、結論は必ず候補回答の範囲から選択／統合してください。

【参考（質問文。参照のみ／根拠化禁止）】
${userPrompt || '(なし)'}

【候補回答（根拠として使用可）】
${lines}

【参考メトリクス（任意参照）】
- 合意率: ${metrics.agreementRatio ?? 'N/A'}
- エントロピー: ${metrics.entropy ?? 'N/A'}

出力は必ず JSON のみ:
{
 "final_answer": "...",            // 候補から選択 or 候補内の要点を統合
 "reason": "...",                  // どの候補のどの根拠か（候補名を明記）
 "confidence": "high|medium|low"
}
`.trim();
}
