const { Pool: PgPool } = require('pg');
const url = require('url');
const net = require('net');

let pool = null;

// Stateful in-memory database arrays
const mockUsers = [];
const mockProducts = [];
const mockOrders = [];

// Helper to run query mock behavior
function runMockQuery(sql, params) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT 1 (connection check)
  if (/^SELECT\s+1/i.test(cleanSql)) {
    return { rows: [{ '?column?': 1 }] };
  }

  // 2. CREATE TABLE IF NOT EXISTS
  if (/^CREATE\s+TABLE/i.test(cleanSql)) {
    return { rows: [] };
  }

  // 3. SET session variables
  if (/^SET\s+/i.test(cleanSql)) {
    return { rows: [] };
  }

  // 4. SELECT COUNT(*) FROM products
  if (/^SELECT\s+COUNT\(\*\)\s+FROM\s+products/i.test(cleanSql)) {
    return { rows: [{ count: mockProducts.length.toString() }] };
  }

  // 5. INSERT INTO products
  if (/^INSERT\s+INTO\s+products/i.test(cleanSql)) {
    mockProducts.push({
      id: params[0],
      name: params[1],
      category: params[2],
      price: params[3],
      rating: params[4],
      reviews_count: params[5],
      description: params[6],
      tag: params[7],
      image: params[8],
      color: params[9],
      stock: params[10],
      specs: params[11],
    });
    return { rows: [] };
  }

  // 6. UPDATE products image path (syncing)
  if (/^UPDATE\s+products\s+SET\s+image\s*=\s*\$1\s+WHERE\s+id\s*=\s*\$2/i.test(cleanSql)) {
    const prod = mockProducts.find(p => p.id === params[1]);
    if (prod) {
      prod.image = params[0];
    }
    return { rows: [] };
  }

  // 7. SELECT * FROM products ORDER BY name ASC
  if (/^SELECT\s+\*\s+FROM\s+products\s+ORDER\s+BY\s+name\s+ASC/i.test(cleanSql)) {
    const sorted = [...mockProducts].sort((a, b) => a.name.localeCompare(b.name));
    return { rows: sorted };
  }

  // 8. SELECT * FROM users WHERE email = $1
  if (/^SELECT\s+\*\s+FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(cleanSql)) {
    const user = mockUsers.find(u => u.email === params[0]);
    return { rows: user ? [user] : [] };
  }

  // 9. INSERT INTO users ... RETURNING id, full_name, email
  if (/^INSERT\s+INTO\s+users/i.test(cleanSql)) {
    const newId = mockUsers.length + 1;
    const newUser = {
      id: newId,
      full_name: params[0],
      email: params[1],
      password_hash: params[2],
      created_at: new Date()
    };
    mockUsers.push(newUser);
    return { rows: [{ id: newUser.id, full_name: newUser.full_name, email: newUser.email }] };
  }

  // 10. SELECT stock, name FROM products WHERE id = $1 FOR UPDATE
  if (/^SELECT\s+stock,\s*name\s+FROM\s+products\s+WHERE\s+id\s*=\s*\$1/i.test(cleanSql)) {
    const prod = mockProducts.find(p => p.id === params[0]);
    if (!prod) {
      return { rows: [] };
    }
    return { rows: [{ stock: prod.stock, name: prod.name }] };
  }

  // 11. UPDATE products SET stock = stock - $1 WHERE id = $2
  if (/^UPDATE\s+products\s+SET\s+stock\s*=\s*stock\s*-\s*\$1\s+WHERE\s+id\s*=\s*\$2/i.test(cleanSql)) {
    const prod = mockProducts.find(p => p.id === params[1]);
    if (prod) {
      prod.stock = prod.stock - parseInt(params[0], 10);
    }
    return { rows: [] };
  }

  // 12. INSERT INTO orders
  if (/^INSERT\s+INTO\s+orders/i.test(cleanSql)) {
    const newOrder = {
      id: params[0],
      user_id: params[1],
      payment_id: params[2],
      amount: params[3],
      address: params[4],
      phone: params[5],
      items: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
      created_at: new Date()
    };
    mockOrders.push(newOrder);
    return { rows: [] };
  }

  // 13. Transactions
  if (/^(BEGIN|COMMIT|ROLLBACK)/i.test(cleanSql)) {
    return { rows: [] };
  }

  // Default fallback
  return { rows: [] };
}

class MockClient {
  async query(sql, params) {
    return runMockQuery(sql, params);
  }
  release() {
    // no-op
  }
}

class MockPool {
  on(_event, _callback) {
    // no-op to handle pgPool.on('connect', ...)
  }
  async connect() {
    return new MockClient();
  }
  async query(sql, params) {
    return runMockQuery(sql, params);
  }
  async end() {
    // no-op
  }
}

// Helper to check TCP reachability
function checkDatabaseReachability(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(2500); // 2.5 seconds timeout

    socket.connect(port, host, () => {
      resolved = true;
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
  });
}

async function initPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (process.env.VERCEL && !connectionString) {
    console.warn('DATABASE_URL environment variable is missing on Vercel. Falling back to MockPool.');
  }

  if (connectionString) {
    try {
      // Parse host and port for pre-connection TCP handshake check
      const parsed = url.parse(connectionString);
      const host = parsed.hostname;
      const port = parseInt(parsed.port || '5432', 10);

      console.log(`Checking TCP reachability to database host ${host}:${port}...`);
      const isReachable = await checkDatabaseReachability(host, port);

      if (!isReachable) {
        console.warn(`Database host ${host}:${port} is unreachable via TCP. Falling back to MockPool immediately.`);
      } else {
        console.log(`Database host ${host}:${port} is reachable. Connecting with PgPool...`);
        // Strip sslmode from URL so Node pg uses our ssl config (fixes Supabase on Vercel)
        const dbUrl = connectionString.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '');
        const pgPool = new PgPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          max: 1, // Max 1 connection per serverless instance (avoids connection leaks/exhaustion)
          idleTimeoutMillis: 1000, // Close idle connection after 1s to release database slots quickly
          connectionTimeoutMillis: 5000, // 5 seconds connection queue timeout
          statement_timeout: 5000, // 5 seconds maximum query execution time
          query_timeout: 5000, // 5 seconds maximum wait for query response
        });

        await pgPool.query('SELECT 1');
        console.log('Connected to PostgreSQL (DATABASE_URL) successfully.');
        pool = pgPool;
        return pool;
      }
    } catch (err) {
      console.warn(`PostgreSQL connection failed: ${err.message}`);
      console.warn('Falling back to zero-dependency in-memory database MockPool.');
    }
  } else {
    console.log('No DATABASE_URL — using in-memory MockPool.');
  }

  pool = new MockPool();
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initPool() before handling requests.');
  }
  return pool;
}

function forceMockPool() {
  pool = new MockPool();
  return pool;
}

module.exports = { initPool, getPool, forceMockPool };
