// frontend-server.js
// Lightweight standalone server to host the built frontend (dist) on port 8099.
// Uses pure Node.js built-in modules so it has ZERO external dependencies.

try {
  require('dotenv').config();
} catch (_) {
  // dotenv is optional
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = parseInt(process.env.FRONTEND_PORT || '8099', 10);
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://192.168.8.10:8094';

// Search candidates for the frontend dist directory
const candidates = [
  process.env.FRONTEND_DIST_DIR,
  path.resolve(__dirname, '../../dashboard-frontend/dist'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, '../dist'),
].filter(Boolean);

let distPath = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
if (!distPath) {
  distPath = path.resolve(__dirname, '../../dashboard-frontend/dist');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

const backendParsed = new URL(BACKEND_API_URL);

const server = http.createServer((req, res) => {
  // 1. Forward /api/* requests to backend API (http://192.168.8.10:8094)
  if (req.url.startsWith('/api')) {
    const proxyOptions = {
      hostname: backendParsed.hostname,
      port: backendParsed.port || (backendParsed.protocol === 'https:' ? 443 : 80),
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: backendParsed.host,
      },
    };

    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[Frontend Server] API proxy error (${req.method} ${req.url}):`, err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `Could not reach backend API at ${BACKEND_API_URL}`,
        details: err.message,
      }));
    });

    req.pipe(proxyReq);
    return;
  }

  // 2. Serve static dist files if dist directory exists
  if (fs.existsSync(distPath)) {
    const reqUrlPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
    let safePath = path.normalize(decodeURIComponent(reqUrlPath)).replace(/^(\.\.[/\\])+/, '');
    if (safePath === '/' || safePath === '') {
      safePath = '/index.html';
    }

    let filePath = path.join(distPath, safePath);

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA Fallback: serve index.html for unknown frontend routes
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      }
    });
    return;
  }

  // 3. Fallback page if frontend hasn't been built yet
  res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Frontend Dist Not Found</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.6; max-width: 680px; margin: auto; color: #222; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
          code { font-family: monospace; }
        </style>
      </head>
      <body>
        <h2>Frontend production build (dist) not found</h2>
        <p>The frontend server is listening on port <strong>${PORT}</strong>, but the compiled static files were not found at:</p>
        <pre>${distPath}</pre>
        <h3>How to build:</h3>
        <ol>
          <li>Open terminal in <code>dashboard-frontend/</code></li>
          <li>Run <code>npm run build</code></li>
          <li>Refresh this page</li>
        </ol>
        <p>Configured backend API: <code>${BACKEND_API_URL}</code></p>
      </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('=======================================================');
  console.log(` Frontend Server running on port ${PORT}`);
  console.log(` Local access:  http://localhost:${PORT}`);
  console.log(` LAN access:    http://192.168.8.10:${PORT}`);
  console.log(` Serving dist:  ${distPath}`);
  console.log(` Backend API:   ${BACKEND_API_URL}`);
  console.log('=======================================================');
});

module.exports = server;
