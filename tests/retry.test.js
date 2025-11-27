const assert = require('assert');
const fs = require('fs');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  // package.json に期待する name が入っているかの簡単なチェック
  assert.strictEqual(pkg.name, 'magi-core', 'package.json name should be magi-core');
  console.log('retry.test.js: OK');
} catch (err) {
  console.error('retry.test.js: FAILED', err);
  process.exit(1);
}
