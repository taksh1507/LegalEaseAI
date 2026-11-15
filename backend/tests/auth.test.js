const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const databasePath = require.resolve('../config/database');
const middlewarePath = require.resolve('../middleware/auth');
process.env.JWT_SECRET = 'local-test-key-with-more-than-32-characters';
function load(pool) {
  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: pool,
  };
  delete require.cache[middlewarePath];
  return require(middlewarePath);
}
function request() {
  return {
    headers: {
      authorization:
        'Bearer ' +
        jwt.sign({ userId: 1, email: 'test@example.test' }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        }),
    },
  };
}
function response() {
  return {
    status(code) {
      this.code = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };
}
test('required auth rejects requests if no database is configured', async () => {
  const req = request(),
    res = response();
  let called = false;
  await load(null).authenticateToken(req, res, () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(res.code, 503);
  assert.equal(req.user, undefined);
});
test('required auth rejects database outages instead of trusting token data', async () => {
  const req = request(),
    res = response();
  let called = false;
  await load({
    query: async () => {
      throw new Error('test outage');
    },
  }).authenticateToken(req, res, () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(res.code, 503);
  assert.equal(req.user, undefined);
});
test('optional auth stays anonymous when the database cannot verify a user', async () => {
  const req = request();
  let called = false;
  await load({
    query: async () => {
      throw new Error('test outage');
    },
  }).optionalAuth(req, response(), () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.user, null);
  assert.equal(req.userId, null);
});
test('verified database user can access protected routes', async () => {
  const user = { id: 1, email: 'test@example.test' };
  let called = false;
  const req = request();
  await load({ query: async () => ({ rows: [user] }) }).authenticateToken(req, response(), () => {
    called = true;
  });
  assert.equal(called, true);
  assert.deepEqual(req.user, { ...user, userId: user.id });
});
test('deleted users stay unauthorized', async () => {
  const req = request(),
    res = response();
  let called = false;
  await load({ query: async () => ({ rows: [] }) }).authenticateToken(req, res, () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(res.code, 401);
});
