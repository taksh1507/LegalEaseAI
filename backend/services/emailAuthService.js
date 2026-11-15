const { randomUUID, createHmac, timingSafeEqual } = require('node:crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { getJWTSecret } = require('../config/security');
const { generateOTP, isValidEmail } = require('../utils/otpUtils');
const { validatePassword, hashPassword, comparePassword } = require('../utils/passwordUtils');
const { sendEmail } = require('./emailService');
const httpError = require('../utils/httpError');

const publicFields =
  'id, name, email, phone_number, mobile_number, email_verified, mobile_verified, auth_method, created_at, token_version';
function normalizeEmail(value) {
  if (typeof value !== 'string' || value.length > 255 || !isValidEmail(value))
    throw httpError(400, 'Valid email is required');
  return value.trim().toLowerCase();
}
function modeValue(mode) {
  if (!['signup', 'signin'].includes(mode)) throw httpError(400, 'Mode must be signup or signin');
  return mode;
}
function codeHash(id, code) {
  return createHmac('sha256', getJWTSecret()).update(`${id}:${code}`).digest('hex');
}
function tokenFor(user) {
  return jwt.sign({ userId: user.id, tokenVersion: user.token_version ?? 0 }, getJWTSecret(), {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

async function sendChallenge(input) {
  const email = normalizeEmail(input.email),
    mode = modeValue(input.mode);
  if (typeof input.password !== 'string' || Buffer.byteLength(input.password) > 72)
    throw httpError(400, 'A password of at most 72 bytes is required');
  const existing = await pool.query('SELECT id, password FROM users WHERE LOWER(email) = $1', [
    email,
  ]);
  let payload;
  if (mode === 'signup') {
    if (existing.rows.length) throw httpError(409, 'An account with this email already exists');
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 255)
      throw httpError(400, 'A name of at most 255 characters is required');
    const validation = validatePassword(input.password);
    if (!validation.valid) throw httpError(400, validation.message);
    if (input.mobile_number && !/^\+?[\d\s()-]{10,20}$/.test(input.mobile_number))
      throw httpError(400, 'Invalid phone number');
    payload = {
      name: input.name.trim(),
      password: await hashPassword(input.password),
      phone: input.mobile_number || null,
    };
  } else {
    const user = existing.rows[0];
    if (!user?.password || !(await comparePassword(input.password, user.password)))
      throw httpError(401, 'Invalid email or password');
    payload = { userId: user.id };
  }
  const id = randomUUID(),
    code = generateOTP();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [email, mode]);
    await client.query('DELETE FROM auth_challenges WHERE email = $1 AND mode = $2', [email, mode]);
    await client.query(
      "INSERT INTO auth_challenges (id, email, mode, code_hash, payload, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '5 minutes')",
      [id, email, mode, codeHash(id, code), payload],
    );
    await client.query("DELETE FROM auth_challenges WHERE expires_at < NOW() - INTERVAL '1 day'");
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const delivery = await sendEmail(email, code);
  if (!delivery.success) {
    await pool.query('DELETE FROM auth_challenges WHERE id = $1', [id]);
    throw httpError(503, 'Email verification service unavailable; no code was issued');
  }
  return {
    success: true,
    identifier: email,
    expiresIn: '5 minutes',
    message: 'Verification code sent to your email',
  };
}

async function verifyChallenge(input) {
  const email = normalizeEmail(input.email),
    mode = modeValue(input.mode);
  if (typeof input.otp !== 'string' || !/^\d{6}$/.test(input.otp))
    throw httpError(400, 'A six-digit verification code is required');
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [email, mode]);
    const result = await client.query(
      'SELECT * FROM auth_challenges WHERE email = $1 AND mode = $2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE',
      [email, mode],
    );
    const challenge = result.rows[0];
    if (
      !challenge ||
      challenge.consumed_at ||
      challenge.attempts >= 5 ||
      new Date(challenge.expires_at) <= new Date()
    )
      throw httpError(400, 'Invalid, expired or exhausted verification code');
    if (
      !timingSafeEqual(
        Buffer.from(codeHash(challenge.id, input.otp), 'hex'),
        Buffer.from(challenge.code_hash, 'hex'),
      )
    ) {
      await client.query('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = $1', [
        challenge.id,
      ]);
      await client.query('COMMIT');
      committed = true;
      throw httpError(400, 'Invalid verification code');
    }
    let resultUser;
    if (mode === 'signup') {
      const data = challenge.payload;
      resultUser = await client.query(
        `INSERT INTO users (name, email, phone_number, mobile_number, password, email_verified, auth_method) VALUES ($1, $2, $3, $3, $4, TRUE, 'email') RETURNING ${publicFields}`,
        [data.name, email, data.phone, data.password],
      );
    } else {
      resultUser = await client.query(
        `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1 AND LOWER(email) = $2 RETURNING ${publicFields}`,
        [challenge.payload.userId, email],
      );
    }
    const user = resultUser.rows[0];
    if (!user) throw httpError(401, 'Account no longer available');
    const token = tokenFor(user);
    await client.query('UPDATE auth_challenges SET consumed_at = NOW() WHERE id = $1', [
      challenge.id,
    ]);
    await client.query('COMMIT');
    committed = true;
    return { success: true, token, user, message: 'Verification successful' };
  } catch (error) {
    if (!committed) await client.query('ROLLBACK');
    if (error.code === '23505') throw httpError(409, 'Account already exists');
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { sendChallenge, verifyChallenge, tokenFor, normalizeEmail };
