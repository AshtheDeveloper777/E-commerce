const serverless = require('serverless-http');
const { app, initialize } = require('../server/app');
const { forceMockPool } = require('../server/db');

const handler = serverless(app);
let ready;

/** Vercel catch-all often strips the /api prefix — Express routes need /api/... */
function normalizePath(req) {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    req.url = `/api${url.startsWith('/') ? url : `/${url}`}`;
  }
}

module.exports = async (req, res) => {
  normalizePath(req);

  // Product images are static Vercel assets. Do not send them through the
  // serverless function; that can time out while streaming files.
  const imageMatch = req.url.match(/\/api\/products\/([^/?]+)\/image/i);
  if (imageMatch) {
    res.statusCode = 308;
    res.setHeader('Location', `/products/${imageMatch[1]}.jpg`);
    res.end();
    return;
  }

  if (!ready) {
    ready = Promise.race([
      initialize(),
      new Promise((resolve) => {
        setTimeout(async () => {
          console.warn('Initialization timed out; using in-memory database fallback.');
          forceMockPool();
          await initialize();
          resolve();
        }, 4000);
      }),
    ]).catch((err) => {
      ready = null; // Reset so that next request retries initialization
      throw err;
    });
  }
  try {
    await ready;
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: `Database connection failed: ${err.message}. Please check your DATABASE_URL in Vercel → Settings → Environment Variables.`
    }));
    return;
  }
  return handler(req, res);
};
