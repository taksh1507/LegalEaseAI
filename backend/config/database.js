const { Pool } = require('pg');

// Database configuration
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('⚠️  DATABASE_URL not configured');
  module.exports = null;
} else {
  console.log('🔗 Using PostgreSQL connection');

  // Create PostgreSQL pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  // Test connection
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
  });

  // Test the connection immediately
  pool.query('SELECT 1 as test')
    .then(() => {
      console.log('✅ Database connection test successful');
    })
    .catch((err) => {
      console.error('❌ Database connection test failed:', err.message);
    });

  module.exports = pool;
}