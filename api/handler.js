const serverless = require('serverless-http');
const { app, initialize } = require('../server/app');

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

  // Skip database initialization entirely for serving static product images to guarantee instant loading
  const isImageRoute = /\/api\/products\/[^/]+\/image/i.test(req.url);
  if (isImageRoute) {
    return handler(req, res);
  }

  if (!ready) {
    ready = initialize().catch((err) => {
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
