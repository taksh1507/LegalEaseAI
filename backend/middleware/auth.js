const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { getJWTSecret } = require('../config/security');

async function resolveUser(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !/^Bearer \S+$/.test(header)) return null;
  const decoded = jwt.verify(header.slice(7), getJWTSecret(), { algorithms: ['HS256'] });
  if (
    !Number.isSafeInteger(decoded.userId) ||
    decoded.userId < 1 ||
    !Number.isSafeInteger(decoded.iat) ||
    !Number.isSafeInteger(decoded.exp) ||
    decoded.exp - decoded.iat > 3600
  )
    return null;
  if (!pool) throw Object.assign(new Error('Authentication unavailable'), { status: 503 });
  let result;
  try {
    result = await pool.query(
      'SELECT id, email, name, created_at, token_version, email_verified, phone_verified, mobile_verified FROM users WHERE id = $1',
      [decoded.userId],
    );
  } catch {
    throw Object.assign(new Error('Authentication unavailable'), { status: 503 });
  }
  if (result.rows[0] && (decoded.tokenVersion ?? 0) !== (result.rows[0].token_version ?? 0))
    return null;
  return result.rows[0] ? { ...result.rows[0], userId: result.rows[0].id } : null;
}

async function authenticateToken(req, res, next) {
  try {
    const user = await resolveUser(req);
    if (!user)
      return res.status(401).json({ success: false, message: 'Valid authentication required' });
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    const status = error.status === 503 ? 503 : 401;
    return res
      .status(status)
      .json({
        success: false,
        message: status === 503 ? 'Authentication service unavailable' : 'Invalid or expired token',
      });
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);
  } catch {
    req.user = null;
  }
  req.userId = req.user?.id ?? null;
  next();
}
function requireVerifiedContact(req, res, next) {
  if (!req.user?.email_verified && !req.user?.phone_verified && !req.user?.mobile_verified)
    return res
      .status(403)
      .json({
        success: false,
        message: 'Verify your email or phone in Profile before using document services.',
      });
  next();
}
module.exports = { authenticateToken, optionalAuth, requireVerifiedContact };
