const pool = require('../config/database');
const fs = require('node:fs/promises');
const path = require('node:path');
const createDocumentHistoryTable = require('../migrations/create_document_history');

async function initializeDatabase() {
  if (!pool) throw new Error('DATABASE_URL is required');
  await pool.query(await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8'));
  await createDocumentHistoryTable();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('legalease-schema-migrations'))");
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())',
    );
    const migration = '20261114_auth_challenges_and_history_ownership';
    const existing = await client.query('SELECT name FROM schema_migrations WHERE name = $1', [
      migration,
    ]);
    if (!existing.rows.length) {
      await client.query(await fs.readFile(path.join(__dirname, 'auth_challenges.sql'), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { initializeDatabase };
