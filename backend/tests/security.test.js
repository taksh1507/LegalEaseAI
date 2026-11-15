const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getJWTSecret } = require('../config/security');
const sms = require('../services/otpService');
const axios = require('axios');
const PDF = require('../services/pdfService');
const ai = require('../services/aiService');

test('missing and short signing keys fail without a predictable fallback', () => {
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(getJWTSecret, /JWT_SECRET/);
    process.env.JWT_SECRET = 'short';
    assert.throws(getJWTSecret, /JWT_SECRET/);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
test('international phone normalization preserves the leading plus', () => {
  assert.equal(sms.formatPhoneNumber('+1 (555) 123-4567'), '+15551234567');
  assert.equal(sms.validatePhoneNumber({ phone: 'invalid' }), false);
});
test('SMS delivery reports unavailable without issuing a mock verification code', async () => {
  const previous = process.env.TWOFACTOR_API_KEY;
  try {
    delete process.env.TWOFACTOR_API_KEY;
    const result = await sms.sendOTP('+15551234567');
    assert.equal(result.success, false);
    assert.equal(result.unavailable, true);
    assert.equal(result.otp, undefined);
  } finally {
    if (previous === undefined) delete process.env.TWOFACTOR_API_KEY;
    else process.env.TWOFACTOR_API_KEY = previous;
  }
});
test('SMS verification uses the configured provider and a bounded network timeout', async () => {
  const previous = process.env.TWOFACTOR_API_KEY,
    get = axios.get;
  let call;
  try {
    process.env.TWOFACTOR_API_KEY = 'local-test-value';
    axios.get = async (url, options) => {
      call = { url, options };
      return { data: { Status: 'Success', Details: 'verified' } };
    };
    assert.equal((await sms.verifyOTP('test-session', '654321')).success, true);
    assert.ok(call.url.endsWith('/SMS/VERIFY/test-session/654321'));
    assert.equal(call.options.timeout, 15000);
    assert.equal(call.options.maxRedirects, 0);
  } finally {
    axios.get = get;
    if (previous === undefined) delete process.env.TWOFACTOR_API_KEY;
    else process.env.TWOFACTOR_API_KEY = previous;
  }
});
test('unconfigured AI never returns fabricated successful analysis or chat', async () => {
  const previous = process.env.OPENAI_ROUTER_KEY;
  try {
    delete process.env.OPENAI_ROUTER_KEY;
    await assert.rejects(ai.analyzeDocument('A test agreement'), { status: 503 });
    await assert.rejects(ai.generateChatResponse('A test question'), { status: 503 });
  } finally {
    if (previous === undefined) delete process.env.OPENAI_ROUTER_KEY;
    else process.env.OPENAI_ROUTER_KEY = previous;
  }
});
test('incomplete provider output is rejected rather than padded with invented findings', () => {
  assert.throws(() => ai.validateAnalysis({ summary: 'Incomplete', clauses: [] }), { status: 502 });
});
test('report templates escape scripts, HTML attributes and nested findings', () => {
  const html = PDF.generateHTMLContent({
    fileName: '<script>attack()</script>',
    summary: { description: '<img src="file:///etc/passwd">' },
    clauses: [{ title: '<b>clause</b>', originalText: '<iframe src="http://localhost">' }],
  });
  assert.ok(!html.includes('<script>attack'));
  assert.ok(!html.includes('<img src='));
  assert.ok(html.includes('&lt;iframe'));
  assert.ok(html.includes('&lt;b&gt;clause'));
});
test('malformed report fields are client errors', () => {
  for (const value of [
    { clauses: [null] },
    { summary: { keyPoints: 42 } },
    { recommendations: [{}] },
    { fileName: 42 },
    { processedAt: 'not a date' },
  ])
    assert.throws(() => PDF.generateHTMLContent(value), { status: 400 });
});
test('report rendering cannot be given a filesystem destination or executable template', async () => {
  await assert.rejects(
    PDF.generatePDF({ fileName: 'fixture' }, { path: '/tmp/forbidden-report.pdf' }),
    { status: 400 },
  );
  await assert.rejects(
    PDF.generatePDF({ fileName: 'fixture' }, { headerTemplate: '<script>attack()</script>' }),
    { status: 400 },
  );
});
