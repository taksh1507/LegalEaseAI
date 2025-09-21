require('dotenv').config();
const pool = require('../config/database');

const createDocumentHistoryTable = async () => {
  if (!pool) {
    console.log('⚠️  Database not configured - skipping document history table creation');
    return;
  }

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS document_history (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        document_type VARCHAR(100),
        summary TEXT,
        risk_level VARCHAR(20) DEFAULT 'Low',
        red_flags_count INTEGER DEFAULT 0,
        clauses_count INTEGER DEFAULT 0,
        analysis_data JSONB NOT NULL,
        analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index on user_email for faster queries
      CREATE INDEX IF NOT EXISTS idx_document_history_user_email ON document_history(user_email);
      
      -- Create index on analysis_date for sorting
      CREATE INDEX IF NOT EXISTS idx_document_history_analysis_date ON document_history(analysis_date DESC);
      
      -- Create composite index for user-specific queries
      CREATE INDEX IF NOT EXISTS idx_document_history_user_date ON document_history(user_email, analysis_date DESC);
    `;

    await pool.query(createTableQuery);
    console.log('✅ Document history table created successfully');
    
    // Create trigger for updated_at
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_document_history_updated_at ON document_history;
      CREATE TRIGGER update_document_history_updated_at
        BEFORE UPDATE ON document_history
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await pool.query(createTriggerQuery);
    console.log('✅ Document history triggers created successfully');
    
  } catch (error) {
    console.error('❌ Error creating document history table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createDocumentHistoryTable()
    .then(() => {
      console.log('✅ Document history migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Document history migration failed:', error);
      process.exit(1);
    });
}

module.exports = createDocumentHistoryTable;