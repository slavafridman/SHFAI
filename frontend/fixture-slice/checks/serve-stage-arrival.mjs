// Owned local static/proxy helper. Never reads environment configuration or Oracle.
import { createServer, request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist/fixture-slice/browser');
const proxy = process.argv.includes('--fixture-proxy');
const nativeDouble = process.argv.includes('--native-http-double-proxy');
if (proxy && nativeDouble) throw Error('Mixed proxy targets are forbidden');
const targetPort = nativeDouble ? 4407 : 4398;
const port = Number(process.argv.find(v => v.startsWith('--port='))?.slice(7) ?? 4388);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid owned test port');
const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    if (!proxy && !nativeDouble) { res.writeHead(503); res.end(); return; }
    const upstream = request({ host: '127.0.0.1', port: targetPort, method: req.method, path: req.url,
      headers: { ...req.headers, host: `127.0.0.1:${targetPort}` } }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    upstream.on('error', () => { res.writeHead(503); res.end(); }); req.pipe(upstream); return;
  }
  try {
    const path = resolve(root, '.' + new URL(req.url, 'http://127.0.0.1').pathname);
    if (!path.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const file = extname(path) ? path : resolve(root, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
      '.woff2': 'font/woff2' })[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
server.listen(port, '127.0.0.1', () => console.log(`Arrival owned UI helper ready ${port}; fixture proxy=${proxy}; native HTTP DOUBLE proxy=${nativeDouble}; target only ${targetPort}`));
process.once('SIGINT', () => server.close()); process.once('SIGTERM', () => server.close());
