require('dotenv').config({ quiet: true });
const pool = require('../config/database');
const { initializeDatabase } = require('./init');
initializeDatabase()
  .then(() => console.log('Database migrations completed'))
  .catch(() => {
    console.error('Database migration failed; verify configuration and database availability');
    process.exitCode = 1;
  })
  .finally(() => pool?.end());
