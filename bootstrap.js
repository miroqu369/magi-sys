const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Status endpoint
app.get('/status', (req, res) => {
    console.log('Status endpoint called');
    res.json({
        service: 'magi-system',
        version: '2.0.0',
        time: new Date().toISOString(),
        status: 'OPERATIONAL'
    });
});

// Decision endpoint
app.post('/api/decision', (req, res) => {
    console.log('[DECISION] Called');
    const { prompt } = req.body || {};
    const decision = prompt && prompt.toLowerCase().includes('should') ? '承認' : '否認';
    res.json({
        final: decision,
        reason: 'Test decision',
        units: [
            { magi_unit: 'BALTHASAR-2', decision: decision },
            { magi_unit: 'MELCHIOR-1', decision: decision },
            { magi_unit: 'CASPER-3', decision: decision }
        ]
    });
});

// Enhanced Consensus endpoint with decision logic
app.post('/api/consensus', (req, res) => {
    console.log('[CONSENSUS] Called with:', req.body.prompt);
    const { prompt = 'test', meta = {} } = req.body || {};
    
    // 判定ロジック
    const shouldApprove = prompt.toLowerCase().includes('should') || 
                         prompt.includes('すべき') || 
                         prompt.includes('必要');
    const shouldDeny = prompt.includes('禁止') || 
                       prompt.includes('危険') || 
                       prompt.toLowerCase().includes('stop');
    
    // 各AIの判定
    const balthasarDecision = shouldDeny ? '否認' : shouldApprove ? '承認' : '保留';
    const melchiorDecision = shouldDeny ? '否認' : '承認';
    const casperDecision = shouldApprove ? '承認' : shouldDeny ? '否認' : '保留';
    
    // 判定カウント
    const decisions = [balthasarDecision, melchiorDecision, casperDecision];
    const approvals = decisions.filter(d => d === '承認').length;
    const denials = decisions.filter(d => d === '否認').length;
    
    let finalDecision;
    if (approvals > denials) {
        finalDecision = '承認';
    } else if (denials > approvals) {
        finalDecision = '否認';
    } else {
        finalDecision = '保留';
    }
    
    res.json({
        version: '2.0.0',
        mode: meta.mode || 'consensus',
        final: '最終判定: ' + finalDecision + ' - ' + prompt,
        decision: finalDecision,
        candidates: [
            { 
                provider: 'grok', 
                magi_unit: 'BALTHASAR-2', 
                ok: true, 
                text: 'Grok: ' + balthasarDecision,
                decision: balthasarDecision
            },
            { 
                provider: 'gemini', 
                magi_unit: 'MELCHIOR-1', 
                ok: true, 
                text: 'Gemini: ' + melchiorDecision,
                decision: melchiorDecision
            },
            { 
                provider: 'claude', 
                magi_unit: 'CASPER-3', 
                ok: true, 
                text: 'Claude: ' + casperDecision,
                decision: casperDecision
            }
        ],
        metrics: { 
            agreement_ratio: approvals / 3,
            response_time_ms: 100,
            valid_responses: 3,
            approvals: approvals,
            denials: denials
        }
    });
});

// Start server
const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log('MAGI System running on port ' + port);
});
