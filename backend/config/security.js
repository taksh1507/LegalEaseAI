function getJWTSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32 || /^(your[-_ ]|change[-_ ]?me)/i.test(value)) {
    const error = new Error('JWT_SECRET must be a unique random value of at least 32 characters');
    error.status = 503;
    throw error;
  }
  return value;
}

function integerSetting(name, fallback, min, max) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Invalid ${name}`);
  return value;
}

module.exports = { getJWTSecret, integerSetting };
