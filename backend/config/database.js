const { Pool } = require('pg');
const { integerSetting } = require('./security');

const databaseUrl = process.env.DATABASE_URL;
let pool = null;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get('sslmode');
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    url.hostname.endsWith('.neon.tech') ||
    (sslMode && sslMode !== 'disable');
  if (sslMode) url.searchParams.delete('sslmode');
  pool = new Pool({
    connectionString: url.toString(),
    ssl: useSSL ? { rejectUnauthorized: true } : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: integerSetting('PG_POOL_MAX', 10, 1, 50),
  });
  pool.on('error', () => console.error('Database connection error'));
}
module.exports = pool;
