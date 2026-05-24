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
    // Strip sslmode from URL so Node pg uses our ssl config (fixes Supabase on Vercel)
    const dbUrl = connectionString.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '');
    const pgPool = new PgPool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await pgPool.query('SELECT 1');
      console.log('Connected to PostgreSQL (DATABASE_URL).');
      pool = pgPool;
      return pool;
    } catch (err) {
      await pgPool.end().catch(() => {});
      if (process.env.VERCEL) {
        throw new Error(
          `DATABASE_URL connection failed on Vercel: ${err.message}. Check your Supabase pooler URL and password.`
        );
      }
      console.warn(`PostgreSQL connection failed: ${err.message}`);
      console.warn('Falling back to in-memory database (local dev only).');
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
