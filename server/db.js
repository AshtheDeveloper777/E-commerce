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
      max: 1, // Max 1 connection per serverless instance (avoids connection leaks/exhaustion)
      idleTimeoutMillis: 1000, // Close idle connection after 1s to release database slots quickly
      connectionTimeoutMillis: 5000, // 5 seconds connection queue timeout
    });

    // Set server-side session timeouts on every connection to prevent locks or deadlocks from hanging
    pgPool.on('connect', (client) => {
      client.query('SET statement_timeout = 10000').catch((err) => {
        console.error('Error setting statement_timeout:', err.message);
      });
      client.query('SET lock_timeout = 5000').catch((err) => {
        console.error('Error setting lock_timeout:', err.message);
      });
    });

    try {
      // Socket and SSL handshake attempts can hang indefinitely.
      // Force handshake check to fail fast within 5 seconds.
      await Promise.race([
        pgPool.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database handshake/connection timeout (5s)')), 5000)
        ),
      ]);
      console.log('Connected to PostgreSQL (DATABASE_URL).');
      pool = pgPool;
      return pool;
    } catch (err) {
      pgPool.end().catch(() => {}); // Close in background, do not block the error boundary
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
