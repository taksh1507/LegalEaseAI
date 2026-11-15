const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('the real server refuses to start without signing/database configuration', () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../index.js')], {
    env: { ...process.env, JWT_SECRET: '', DATABASE_URL: '', NODE_ENV: 'test' },
    timeout: 10000,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /API startup failed/);
  assert.ok(!result.stdout.includes('API is listening'));
});
