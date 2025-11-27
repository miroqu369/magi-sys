const assert = require('assert');
const fs = require('fs');

try {
  // providers ディレクトリの存在確認（存在すれば OK）
  const exists = fs.existsSync('providers');
  assert.ok(exists, 'providers directory should exist');
  console.log('base-provider.test.js: OK');
} catch (err) {
  console.error('base-provider.test.js: FAILED', err);
  process.exit(1);
}
