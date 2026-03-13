/**
 * OBINexus Governance Platform Server
 * Trident Routing: OHA (Public) | IWU (Law) | IJI (Order)
 *
 * @author Nnamdi Michael Okpala
 * @license Unlicense
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Resolve subdomain to workspace directory
 * oha.obinexus.org → oha.obinexus.org/
 * iwu.obinexus.org → iwu.obinexus.org/
 * iji.obinexus.org → iji.obinexus.org/
 * obinexus.org     → obinexus.org/
 */
function resolveSubdomain(host) {
  if (!host) return 'obinexus.org';
  const hostname = host.split(':')[0];

  if (hostname.startsWith('oha.')) return 'oha.obinexus.org';
  if (hostname.startsWith('iwu.')) return 'iwu.obinexus.org';
  if (hostname.startsWith('iji.')) return 'iji.obinexus.org';

  return 'obinexus.org';
}

/**
 * Serve static files with subdomain routing
 */
const server = http.createServer((req, res) => {
  const subdomain = resolveSubdomain(req.headers.host);

  // URL path routing — also support /oha, /iwu, /iji paths for single-domain mode
  let urlPath = req.url.split('?')[0];
  let targetDir = subdomain;

  if (urlPath.startsWith('/oha')) {
    targetDir = 'oha.obinexus.org';
    urlPath = urlPath.replace(/^\/oha/, '') || '/';
  } else if (urlPath.startsWith('/iwu')) {
    targetDir = 'iwu.obinexus.org';
    urlPath = urlPath.replace(/^\/iwu/, '') || '/';
  } else if (urlPath.startsWith('/iji')) {
    targetDir = 'iji.obinexus.org';
    urlPath = urlPath.replace(/^\/iji/, '') || '/';
  } else if (urlPath.startsWith('/shared')) {
    targetDir = 'shared';
    urlPath = urlPath.replace(/^\/shared/, '') || '/';
  }

  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath === '/public') urlPath = '/public/index.html';

  // Try public/ subdirectory first, then root
  const publicPath = path.join(__dirname, targetDir, 'public', urlPath);
  const rootPath = path.join(__dirname, targetDir, urlPath);
  const sharedPath = path.join(__dirname, 'shared', urlPath);

  let filePath = fs.existsSync(publicPath) ? publicPath
    : fs.existsSync(rootPath) ? rootPath
    : fs.existsSync(sharedPath) ? sharedPath
    : null;

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 — Division Not Found</h1><p>The trident does not recognize this path.</p>');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║     OBINexus Governance Platform v1.0.0      ║
  ║                                              ║
  ║  Trident Divisions:                          ║
  ║    OHA (Public)  → /oha  or oha.obinexus.org ║
  ║    IWU (Law)     → /iwu  or iwu.obinexus.org ║
  ║    IJI (Order)   → /iji  or iji.obinexus.org ║
  ║                                              ║
  ║  Listening on port ${PORT}                      ║
  ╚══════════════════════════════════════════════╝
  `);
});
