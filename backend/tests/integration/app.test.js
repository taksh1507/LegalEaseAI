const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomBytes, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const database = process.env.TEST_DATABASE_URL;
if (!database || process.env.ALLOW_TEST_DATABASE_RESET !== '1')
  throw new Error(
    'Integration tests require TEST_DATABASE_URL and ALLOW_TEST_DATABASE_RESET=1 for a disposable database',
  );
const target = new URL(database);
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
  !target.pathname.endsWith('_test')
)
  throw new Error('Refusing to reset a database outside loopback or without a _test name');
Object.assign(process.env, {
  DATABASE_URL: database,
  NODE_ENV: 'test',
  JWT_SECRET: randomBytes(48).toString('hex'),
  AUTH_RATE_LIMIT: '1000',
  API_RATE_LIMIT: '1000',
  DOCUMENT_RATE_LIMIT: '1000',
  OPENAI_ROUTER_KEY: 'local-provider-test-value',
});
const mailbox = new Map();
const emailPath = require.resolve('../../services/emailService');
let deliveryAvailable = true;
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendEmail: async (email, code) => {
      if (!deliveryAvailable) return { success: false };
      mailbox.set(email, code);
      return { success: true };
    },
  },
};
const sms = require('../../services/otpService');
const smsSessions = new Set();
let smsVerifications = 0;
sms.sendOTP = async () => {
  const id = randomUUID();
  smsSessions.add(id);
  return { success: true, sessionId: id };
};
sms.verifyOTP = async (id, code) => {
  smsVerifications++;
  const success = smsSessions.has(id) && code === '654321';
  if (success) smsSessions.delete(id);
  return { success };
};
const pool = require('../../config/database');
const { initializeDatabase } = require('../../database/init');
let lastPrompt = '';
let server,
  provider,
  base,
  providerMode = 'ok',
  userNumber = 0;
const fixture = {
  summary: 'Test-only analysis of the supplied payment agreement.',
  documentType: 'contract',
  clauses: [
    {
      title: 'Payment',
      originalText: 'Payment is due in 30 days.',
      explanation: 'Payment is due within the stated period.',
      riskLevel: 'low',
      importance: 'high',
      keyTerms: ['30 days'],
    },
  ],
  redFlags: [],
  keyDates: [],
  overallRiskLevel: 'low',
  recommendations: ['Check the payment date.'],
  missingClauses: [],
  favorability: {
    forParty1: 'unknown',
    forParty2: 'unknown',
    explanation: 'The short test fixture does not establish overall favorability.',
  },
};
const password = 'Strong-test-password1!';
function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
}
function close(s) {
  return new Promise((resolve) => s.close(resolve));
}
async function request(route, { method = 'GET', token, body, headers = {}, raw } = {}) {
  const response = await fetch(base + route, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : raw,
  });
  const type = response.headers.get('content-type') || '';
  const data = type.includes('json')
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());
  return { status: response.status, data, headers: response.headers };
}
async function account() {
  const email = `user-${++userNumber}@example.test`;
  const result = await request('/api/auth/register-email', {
    method: 'POST',
    body: { email, password, name: 'Local Test User' },
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email, mode: 'signin', password },
  });
  const verified = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: { email, mode: 'signin', otp: mailbox.get(email) },
  });
  assert.equal(verified.status, 200, JSON.stringify(verified.data));
  return { ...result.data.user, token: verified.data.token, email };
}
before(async () => {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await initializeDatabase();
  await initializeDatabase(); // The additive migration must also be idempotent.
  provider = await listen(
    http.createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      const prompt = JSON.parse(body).messages.at(-1).content;
      lastPrompt = prompt;
      if (providerMode === 'error') {
        res.writeHead(503);
        res.end('unavailable');
        return;
      }
      const content =
        providerMode === 'invalid'
          ? 'not valid JSON'
          : prompt.startsWith('Analyze the complete document')
            ? JSON.stringify(
                providerMode === 'invented-quote'
                  ? {
                      ...fixture,
                      clauses: [
                        {
                          ...fixture.clauses[0],
                          originalText: 'A clause not present in the submitted document.',
                        },
                      ],
                    }
                  : fixture,
              )
            : 'Test-only response about the supplied clause.';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ choices: [{ message: { content } }] }));
    }),
  );
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${provider.address().port}/v1`;
  server = await listen(require('../../app').createApp());
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  providerMode = 'ok';
  deliveryAvailable = true;
});
after(async () => {
  if (server) await close(server);
  if (provider) await close(provider);
  await pool.end();
});

test('liveness, database readiness and security headers are truthful', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await request('/ready')).status, 200);
});
test('CORS rejects arbitrary origins without wildcard access', async () => {
  assert.equal(
    (await request('/health', { headers: { Origin: 'https://untrusted.example' } })).status,
    403,
  );
  const result = await request('/health', { headers: { Origin: 'http://localhost:3000' } });
  assert.equal(result.headers.get('access-control-allow-origin'), 'http://localhost:3000');
});
test('password signup hashes passwords and login returns a usable identity', async () => {
  const user = await account();
  const record = (await pool.query('SELECT password FROM users WHERE id=$1', [user.id])).rows[0];
  assert.notEqual(record.password, password);
  assert.match(record.password, /^\$2/);
  const result = await request('/api/auth/login-email', {
    method: 'POST',
    body: { email: user.email.toUpperCase(), password },
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.user.password, undefined);
  assert.equal((await request('/api/auth/profile', { token: result.data.token })).status, 200);
});
test('malformed and weak signup values are rejected before database writes', async () => {
  for (const body of [
    { email: { $ne: null }, password, name: 'Invalid' },
    { email: 'weak@example.test', password: 'short', name: 'Invalid' },
    { email: 'long@example.test', password: 'A'.repeat(80), name: 'Invalid' },
  ]) {
    assert.equal((await request('/api/auth/register-email', { method: 'POST', body })).status, 400);
  }
});
test('wrong credentials are rejected with no token', async () => {
  const user = await account();
  const result = await request('/api/auth/login-email', {
    method: 'POST',
    body: { email: user.email, password: 'Wrong-password1!' },
  });
  assert.equal(result.status, 401);
  assert.equal(result.data.token, undefined);
});
test('email signup binds the verified code to the original payload, then prevents replay', async () => {
  const email = 'otp-signup@example.test';
  const sent = await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email, mode: 'signup', name: 'Original Name', password },
  });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  assert.equal(sent.data.otp, undefined);
  assert.equal(sent.data.mockOtp, undefined);
  const code = mailbox.get(email);
  assert.match(code, /^\d{6}$/);
  const row = (
    await pool.query('SELECT code_hash, payload FROM auth_challenges WHERE email=$1', [email])
  ).rows[0];
  assert.notEqual(row.code_hash, code);
  assert.notEqual(row.payload.password, password);
  const verified = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: {
      email,
      mode: 'signup',
      otp: code,
      name: 'Changed Name',
      password: 'Changed-password2!',
    },
  });
  assert.equal(verified.status, 200, JSON.stringify(verified.data));
  assert.equal(verified.data.user.name, 'Original Name');
  assert.equal(
    (
      await request('/api/auth/verify-otp', {
        method: 'POST',
        body: { email, mode: 'signup', otp: code },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request('/api/auth/login-email', { method: 'POST', body: { email, password } })).status,
    200,
  );
});
test('five wrong email codes exhaust the challenge even if the correct code is later supplied', async () => {
  const user = await account();
  await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email: user.email, mode: 'signin', password },
  });
  const code = mailbox.get(user.email),
    wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await request('/api/auth/verify-otp', {
          method: 'POST',
          body: { email: user.email, mode: 'signin', otp: wrong },
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await request('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: user.email, mode: 'signin', otp: code },
      })
    ).status,
    400,
  );
});
test('expired codes and incorrect modes cannot authenticate', async () => {
  const user = await account();
  await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email: user.email, mode: 'signin', password },
  });
  const code = mailbox.get(user.email);
  assert.equal(
    (
      await request('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: user.email, mode: 'signup', otp: code },
      })
    ).status,
    400,
  );
  await pool.query(
    "UPDATE auth_challenges SET expires_at=NOW()-INTERVAL '1 second' WHERE email=$1",
    [user.email],
  );
  assert.equal(
    (
      await request('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: user.email, mode: 'signin', otp: code },
      })
    ).status,
    400,
  );
});
test('email delivery errors never return codes or successful authentication', async () => {
  deliveryAvailable = false;
  const result = await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email: 'undelivered@example.test', mode: 'signup', password, name: 'Not Delivered' },
  });
  assert.equal(result.status, 503);
  assert.equal(result.data.token, undefined);
  assert.equal(result.data.otp, undefined);
  assert.equal(
    (
      await pool.query('SELECT id FROM auth_challenges WHERE email=$1', [
        'undelivered@example.test',
      ])
    ).rows.length,
    0,
  );
});
test('simultaneous verification consumes an email challenge only once', async () => {
  const user = await account();
  await request('/api/auth/send-otp', {
    method: 'POST',
    body: { email: user.email, mode: 'signin', password },
  });
  const body = { email: user.email, mode: 'signin', otp: mailbox.get(user.email) };
  const results = await Promise.all([
    request('/api/auth/verify-otp', { method: 'POST', body }),
    request('/api/auth/verify-otp', { method: 'POST', body }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
});
test('mobile codes are checked against the provider rather than assumed valid', async () => {
  const sent = await request('/api/auth/send-mobile-otp', {
    method: 'POST',
    body: { phoneNumber: '+15551234567', action: 'register' },
  });
  assert.equal(sent.status, 200);
  const beforeCalls = smsVerifications;
  const invalid = await request('/api/auth/verify-mobile-otp', {
    method: 'POST',
    body: { sessionId: sent.data.sessionId, otp: '111111', userData: { name: 'Phone Test' } },
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.data.token, undefined);
  assert.equal(smsVerifications, beforeCalls + 1);
  const valid = await request('/api/auth/verify-mobile-otp', {
    method: 'POST',
    body: { sessionId: sent.data.sessionId, otp: '654321', userData: { name: 'Phone Test' } },
  });
  assert.equal(valid.status, 200, JSON.stringify(valid.data));
  assert.ok(valid.data.token);
});
test('profile verification cannot substitute a different email after receiving a code', async () => {
  const user = await account(),
    email = 'verified-target@example.test';
  assert.equal(
    (
      await request('/api/auth/send-email-otp-profile', {
        method: 'POST',
        token: user.token,
        body: { email },
      })
    ).status,
    200,
  );
  const body = {
    field: 'email',
    newValue: 'unverified-target@example.test',
    otp: mailbox.get(email),
  };
  assert.equal(
    (await request('/api/auth/verify-profile-change', { method: 'POST', token: user.token, body }))
      .status,
    400,
  );
  const good = await request('/api/auth/verify-profile-change', {
    method: 'POST',
    token: user.token,
    body: { ...body, newValue: email },
  });
  assert.equal(good.status, 200, JSON.stringify(good.data));
  assert.equal(good.data.user.email, email);
});
test('password changes revoke old tokens and new logins remain usable', async () => {
  const user = await account(),
    nextPassword = 'A-different-password2!';
  const changed = await request('/api/auth/change-password', {
    method: 'POST',
    token: user.token,
    body: { currentPassword: password, newPassword: nextPassword },
  });
  assert.equal(changed.status, 200, JSON.stringify(changed.data));
  assert.equal((await request('/api/auth/profile', { token: user.token })).status, 401);
  const login = await request('/api/auth/login-email', {
    method: 'POST',
    body: { email: user.email, password: nextPassword },
  });
  assert.equal(login.status, 200);
  assert.equal((await request('/api/auth/profile', { token: login.data.token })).status, 200);
});
test('document history is owner-scoped, paginated and cannot be claimed by reusing an email', async () => {
  const owner = await account(),
    other = await account();
  const saved = await request('/api/document-history', {
    method: 'POST',
    token: owner.token,
    body: {
      fileName: 'Private contract',
      riskLevel: 'high',
      summary: 'Private',
      analysisData: { marker: 'owner-only' },
    },
  });
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  const id = saved.data.data.id;
  assert.equal((await request('/api/document-history/' + id, { token: other.token })).status, 404);
  assert.equal(
    (await request('/api/document-history/' + id, { method: 'DELETE', token: other.token })).status,
    404,
  );
  await pool.query('UPDATE users SET email=$1 WHERE id=$2', [
    'changed-owner@example.test',
    owner.id,
  ]);
  await pool.query('UPDATE users SET email=$1 WHERE id=$2', [owner.email, other.id]);
  assert.equal((await request('/api/document-history', { token: other.token })).data.total, 0);
  assert.equal((await request('/api/document-history', { token: owner.token })).data.total, 1);
  assert.equal(
    (await request('/api/document-history?limit=-1', { token: owner.token })).status,
    400,
  );
  assert.equal(
    (await request('/api/document-history/stats', { token: owner.token })).data.data
      .high_risk_count,
    1,
  );
  assert.equal(
    (await request('/api/document-history', { method: 'DELETE', token: owner.token })).data
      .deletedCount,
    1,
  );
});
test('conversation messages persist real service responses atomically and remain owner-scoped', async () => {
  const owner = await account(),
    other = await account();
  const created = await request('/api/chat/conversations', {
    method: 'POST',
    token: owner.token,
    body: { title: 'Contract questions', documentContext: 'Payment is due in 30 days.' },
  });
  assert.equal(created.status, 200);
  const id = created.data.data.id;
  assert.equal(
    (await request(`/api/chat/conversations/${id}/messages`, { token: other.token })).status,
    404,
  );
  const sent = await request(`/api/chat/conversations/${id}/messages`, {
    method: 'POST',
    token: owner.token,
    body: { content: 'When is payment due?' },
  });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  assert.equal(sent.data.data.aiMessage.content, 'Test-only response about the supplied clause.');
  assert.equal(
    (await request(`/api/chat/conversations/${id}/messages`, { token: owner.token })).data.data
      .length,
    2,
  );
  providerMode = 'error';
  assert.equal(
    (
      await request(`/api/chat/conversations/${id}/messages`, {
        method: 'POST',
        token: owner.token,
        body: { content: 'Try again' },
      })
    ).status,
    503,
  );
  assert.equal(
    (await request(`/api/chat/conversations/${id}/messages`, { token: owner.token })).data.data
      .length,
    2,
  );
  assert.equal(
    (await request(`/api/chat/conversations/${id}`, { method: 'DELETE', token: other.token }))
      .status,
    404,
  );
});
test('analysis and chat require authentication and propagate provider failures honestly', async () => {
  assert.equal(
    (await request('/api/document/analyze-text', { method: 'POST', body: { text: 'Agreement' } }))
      .status,
    401,
  );
  const user = await account();
  const result = await request('/api/document/analyze-text', {
    method: 'POST',
    token: user.token,
    body: { text: 'Payment is due in 30 days.' },
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.data.clauses[0].riskLevel, 'low');
  providerMode = 'error';
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: user.token,
        body: { text: 'Agreement' },
      })
    ).status,
    503,
  );
  assert.equal(
    (await request('/api/chat', { method: 'POST', token: user.token, body: { message: 'Help' } }))
      .status,
    503,
  );
  providerMode = 'invented-quote';
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: user.token,
        body: { text: 'Payment is due in 30 days.' },
      })
    ).status,
    502,
  );
  providerMode = 'invalid';
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: user.token,
        body: { text: 'Agreement' },
      })
    ).status,
    502,
  );
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: user.token,
        body: { text: {} },
      })
    ).status,
    400,
  );
});
test('TXT uploads work, oversized text and mismatched PDF signatures are rejected', async () => {
  const user = await account();
  const good = new FormData();
  good.append(
    'document',
    new Blob(['Payment is due in 30 days.'], { type: 'text/plain' }),
    'agreement.txt',
  );
  assert.equal(
    (await request('/api/document/analyze-file', { method: 'POST', token: user.token, raw: good }))
      .status,
    200,
  );
  const bad = new FormData();
  bad.append('document', new Blob(['not a PDF'], { type: 'application/pdf' }), 'agreement.pdf');
  assert.equal(
    (await request('/api/document/analyze-file', { method: 'POST', token: user.token, raw: bad }))
      .status,
    400,
  );
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: user.token,
        body: { text: 'x'.repeat(60001) },
      })
    ).status,
    413,
  );
});
test('PDF output is readable, report HTML is escaped and filesystem options are rejected', async () => {
  const user = await account();
  const report = {
    fileName: 'Local test agreement',
    summary: { title: 'Verified test report', description: 'Payment is due in 30 days.' },
    clauses: fixture.clauses,
    redFlags: [],
    recommendations: [],
    missingClauses: [],
    overallRiskLevel: 'low',
  };
  const preview = await request('/api/pdf/preview-html', {
    method: 'POST',
    token: user.token,
    body: { documentData: { ...report, fileName: '<img src="http://127.0.0.1/secret">' } },
  });
  assert.equal(preview.status, 200);
  assert.ok(preview.data.data.html.includes('&lt;img'));
  assert.ok(!preview.data.data.html.includes('<img src='));
  assert.equal(
    (
      await request('/api/pdf/generate', {
        method: 'POST',
        token: user.token,
        body: { documentData: report, options: { path: '/tmp/forbidden.pdf' } },
      })
    ).status,
    400,
  );
  const result = await request('/api/pdf/generate', {
    method: 'POST',
    token: user.token,
    body: { documentData: report },
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.subarray(0, 5).toString(), '%PDF-');
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: result.data });
  try {
    assert.match((await parser.getText()).text, /Payment is due in 30 days/);
  } finally {
    await parser.destroy();
  }
});
test('auth rate limits return an explicit retry response', async () => {
  process.env.AUTH_RATE_LIMIT = '1';
  const limited = await listen(require('../../app').createApp());
  process.env.AUTH_RATE_LIMIT = '1000';
  const previous = base;
  base = `http://127.0.0.1:${limited.address().port}`;
  try {
    assert.equal(
      (
        await request('/api/auth/login-email', {
          method: 'POST',
          body: { email: 'absent@example.test', password },
        })
      ).status,
      401,
    );
    const second = await request('/api/auth/login-email', {
      method: 'POST',
      body: { email: 'absent@example.test', password },
    });
    assert.equal(second.status, 429);
    assert.ok(second.headers.get('retry-after'));
  } finally {
    base = previous;
    await close(limited);
  }
});

test('unverified password accounts cannot bypass contact verification to spend AI credits', async () => {
  const created = await request('/api/auth/register-email', {
    method: 'POST',
    body: { email: 'unverified@example.test', password, name: 'Unverified' },
  });
  assert.equal(created.status, 201);
  assert.equal((await request('/api/auth/profile', { token: created.data.token })).status, 200);
  assert.equal(
    (
      await request('/api/document/analyze-text', {
        method: 'POST',
        token: created.data.token,
        body: { text: 'Private document' },
      })
    ).status,
    403,
  );
});
test('real DOCX extraction reaches the AI provider and malformed archives fail safely', async () => {
  const user = await account();
  const { zipSync, strToU8 } = require('fflate');
  const document =
    '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Payment is due in 30 days.</w:t></w:r></w:p></w:body></w:document>';
  const content = zipSync({
    'word/document.xml': strToU8(document),
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
  });
  const form = new FormData();
  form.append(
    'document',
    new Blob([content], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    'agreement.docx',
  );
  const result = await request('/api/document/analyze-file', {
    method: 'POST',
    token: user.token,
    raw: form,
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.match(lastPrompt, /Payment is due in 30 days/);
  const bad = new FormData();
  bad.append('document', new Blob(['not a zip']), 'invalid.docx');
  assert.equal(
    (await request('/api/document/analyze-file', { method: 'POST', token: user.token, raw: bad }))
      .status,
    400,
  );
  const expanded = new FormData();
  expanded.append(
    'document',
    new Blob([zipSync({ 'word/document.xml': new Uint8Array(21 * 1024 * 1024) })]),
    'oversized.docx',
  );
  assert.equal(
    (
      await request('/api/document/analyze-file', {
        method: 'POST',
        token: user.token,
        raw: expanded,
      })
    ).status,
    413,
  );
});
test('PDF extraction analyzes the actual rendered report text', async () => {
  const user = await account();
  const report = {
    fileName: 'PDF extraction fixture',
    summary: { title: 'Agreement', description: 'Payment is due in 30 days.' },
    clauses: [],
    redFlags: [],
    recommendations: [],
    missingClauses: [],
  };
  const pdf = await request('/api/pdf/generate', {
    method: 'POST',
    token: user.token,
    body: { documentData: report },
  });
  assert.equal(pdf.status, 200);
  const form = new FormData();
  form.append('document', new Blob([pdf.data], { type: 'application/pdf' }), 'agreement.pdf');
  const result = await request('/api/document/analyze-file', {
    method: 'POST',
    token: user.token,
    raw: form,
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.match(lastPrompt, /Payment is due in 30 days/);
});

test('legacy profile updates cannot bypass verified contact changes', async () => {
  const user = await account();
  const result = await request('/api/auth/profile', {
    method: 'PUT',
    token: user.token,
    body: { email: 'unverified-replacement@example.test' },
  });
  assert.equal(result.status, 400);
  assert.equal(
    (await pool.query('SELECT email FROM users WHERE id=$1', [user.id])).rows[0].email,
    user.email,
  );
});
test('actual server entry point starts with explicit configuration and shuts down cleanly', async () => {
  const { spawn } = require('node:child_process');
  const portServer = await listen(http.createServer());
  const port = portServer.address().port;
  await close(portServer);
  const child = spawn(process.execPath, [path.join(__dirname, '../../index.js')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exit = new Promise((resolve) =>
    child.once('exit', (code, signal) => resolve({ code, signal })),
  );
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      child.stdout.on('data', (chunk) => {
        if (chunk.toString().includes('API is listening')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.once('exit', () => {
        clearTimeout(timeout);
        reject(new Error('Server exited before becoming ready'));
      });
    });
    assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 200);
  } finally {
    child.kill('SIGTERM');
  }
  assert.equal((await exit).code, 0);
});
