require('dotenv').config({ quiet: true });
const { getJWTSecret, integerSetting } = require('./config/security');
const pool = require('./config/database');
const { createApp } = require('./app');

async function startServer() {
  getJWTSecret();
  if (!pool) throw new Error('DATABASE_URL is required');
  await pool.query('SELECT 1');
  if (process.env.AUTO_MIGRATE === 'true') await require('./database/init').initializeDatabase();
  await pool.query(
    'SELECT token_version FROM users LIMIT 0; SELECT user_id FROM document_history LIMIT 0; SELECT id FROM auth_challenges LIMIT 0',
  );
  const server = createApp().listen(
    integerSetting('PORT', 5000, 1, 65535),
    process.env.HOST || '127.0.0.1',
    () => console.log('LegalEaseAI API is listening'),
  );
  let closing = false;
  async function shutdown() {
    if (closing) return;
    closing = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      await pool.end();
      clearTimeout(timeout);
    });
  }
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}
if (require.main === module)
  startServer().catch(() => {
    console.error('API startup failed: verify database availability, JWT_SECRET and configuration');
    process.exitCode = 1;
    pool?.end();
  });
module.exports = { startServer };
