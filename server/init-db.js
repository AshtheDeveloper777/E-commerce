require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { initialize } = require('./app');
const { getPool } = require('./db');

async function run() {
  console.log('Starting manual database initialization and seeding...');
  try {
    // Run the full initialization (schema creation + seeding)
    await initialize();
    console.log('Database successfully initialized and seeded!');
    
    // Close the pool to allow the process to exit cleanly
    const pool = getPool();
    await pool.end();
    console.log('Database pool closed. Exiting successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
}

run();
