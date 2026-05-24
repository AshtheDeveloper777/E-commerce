const { Pool: PgPool } = require('pg');
const { newDb } = require('pg-mem');

let pool = null;

function createInMemoryPool() {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const { Pool } = mem.adapters.createPg();
  return new Pool();
}

async function initPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (process.env.VERCEL && !connectionString) {
    throw new Error('DATABASE_URL environment variable is required on Vercel.');
  }

  if (connectionString) {
    const pgPool = new PgPool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgPool.query('SELECT 1');
      console.log('Connected to PostgreSQL (DATABASE_URL).');
      pool = pgPool;
      return pool;
    } catch (err) {
      console.warn(`PostgreSQL connection failed: ${err.message}`);
      console.warn('Falling back to in-memory database (resets when server stops).');
      await pgPool.end().catch(() => {});
    }
  } else {
    console.log('No DATABASE_URL — using in-memory database for local development.');
  }

  pool = createInMemoryPool();
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initPool() before handling requests.');
  }
  return pool;
}

module.exports = { initPool, getPool };
