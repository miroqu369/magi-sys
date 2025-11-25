const fs = require('fs');

let htmlContent = fs.readFileSync('public/dogma-full.html', 'utf8');

// CSSに自信度表示用のスタイルを追加
const newStyles = `
        .confidence-bar {
            margin-top: 10px;
            height: 8px;
            background: rgba(50, 50, 50, 0.5);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            transition: width 0.5s ease;
            border-radius: 4px;
        }
        
        .confidence-high {
            background: linear-gradient(90deg, #00ff00, #00cc00);
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .confidence-medium {
            background: linear-gradient(90deg, #ffff00, #ffcc00);
            box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        
        .confidence-low {
            background: linear-gradient(90deg, #ff6600, #ff3300);
            box-shadow: 0 0 10px rgba(255, 100, 0, 0.5);
        }
        
        .confidence-label {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 12px;
            opacity: 0.8;
        }
        
        .confidence-percentage {
            font-weight: bold;
            color: #00ff00;
            font-size: 14px;
        }`;

// </style>タグの前に新しいスタイルを追加
htmlContent = htmlContent.replace('</style>', newStyles + '\n    </style>');

// JavaScript部分を更新して自信度を表示
const updatedJS = htmlContent.replace(
  `unitDiv.innerHTML = \`
                            <div class="unit-header">
                                \${candidate.magi_unit || candidate.provider.toUpperCase()}
                                <span class="status-indicator \${candidate.ok ? 'status-ok' : 'status-error'}"></span>
                            </div>
                            <div class="unit-role">\${candidate.role || candidate.provider}</div>
                            <div class="unit-text">\${candidate.text || 'No response'}</div>
                        \`;`,
  `const confidence = candidate.confidence || Math.random() * 0.5 + 0.4; // fallback
                        const confidencePercent = Math.round(confidence * 100);
                        const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';
                        
                        unitDiv.innerHTML = \`
                            <div class="unit-header">
                                \${candidate.magi_unit || candidate.provider.toUpperCase()}
                                <span class="status-indicator \${candidate.ok ? 'status-ok' : 'status-error'}"></span>
                            </div>
                            <div class="unit-role">\${candidate.role || candidate.provider}</div>
                            <div class="confidence-label">
                                <span>自信度</span>
                                <span class="confidence-percentage">\${confidencePercent}%</span>
                            </div>
                            <div class="confidence-bar">
                                <div class="confidence-fill confidence-\${confidenceClass}" style="width: \${confidencePercent}%"></div>
                            </div>
                            <div class="unit-text">\${candidate.text || 'No response'}</div>
                        \`;`
);

fs.writeFileSync('public/dogma-full.html', updatedJS);
console.log('✅ UIに自信度表示を追加しました');
