const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/status', (req, res) => {
  res.json({
    service: 'MAGI System v2.0',
    mode: 'mock',
    units: ['BALTHASAR-2', 'MELCHIOR-1', 'CASPER-3']
  });
});

app.post('/api/consensus', (req, res) => {
  const {prompt, meta = {}} = req.body;
  const mode = meta.mode || 'consensus';
  
  const finals = {
    consensus: 'CONSENSUS: ' + prompt + ' - 3つのAIが合議した結果です',
    integration: 'INTEGRATION: ' + prompt + ' - 統合的な分析結果です',
    synthesis: 'SYNTHESIS: ' + prompt + ' - 創発的な洞察です'
  };
  
  res.json({
    final: finals[mode],
    mode: mode,
    candidates: [
      {magi_unit: 'BALTHASAR-2', text: 'Grok: ' + prompt},
      {magi_unit: 'MELCHIOR-1', text: 'Gemini: ' + prompt},
      {magi_unit: 'CASPER-3', text: 'Claude: ' + prompt}
    ]
  });
});

app.listen(8081, () => {
  console.log('MAGI System running on port 8081');
});
