const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const createDocumentHistoryTable = require('../migrations/create_document_history');

async function initializeDatabase() {
  try {
    // Check if DATABASE_URL is properly configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your_database_url_here')) {
      console.log('⚠️  Database URL not configured - running in development mode without database');
      console.log('📝 To enable database features, set DATABASE_URL in your .env file');
      return;
    }

    // Test database connection first
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Read and execute schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    if (schemaSQL.trim()) {
      await pool.query(schemaSQL);
      console.log('✅ Database schema initialized successfully');
    } else {
      console.log('⚠️  Schema file is empty - skipping schema initialization');
    }

    // Run document history migration
    console.log('Running document history migration...');
    await createDocumentHistoryTable();
    console.log('✅ Document history migration completed successfully');

  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('🔧 Running in development mode without database connection');
    console.log('📝 Check your DATABASE_URL in .env file and ensure the database is accessible');
    
    // Don't throw error - allow server to start without database
    return;
  }
}

module.exports = {
  initializeDatabase
};