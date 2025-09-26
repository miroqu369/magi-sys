'use strict';

// テスト環境変数を設定
process.env.PORT = 8080;
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';
process.env.XAI_API_KEY = process.env.XAI_API_KEY || 'test-key';

console.log('=================================');
console.log('Starting Magi System Test Server');
console.log('=================================');
console.log('Port: 8080');
console.log('Mode: Local Testing');

// bootstrap.jsを実行
require('./bootstrap.js');

console.log('');
console.log('=================================');
console.log('🚀 Server is running!');
console.log('=================================');
console.log('');
console.log('Access methods:');
console.log('1. Click "Web Preview" button in Cloud Shell');
console.log('2. Select "Preview on port 8080"');
console.log('');
console.log('Available pages:');
console.log('  / - Main page');
console.log('  /grok-unique.html - Grok Unique Mode');
console.log('  /status - System Status (JSON)');
console.log('');
