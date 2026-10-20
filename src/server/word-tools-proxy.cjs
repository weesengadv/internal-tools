const http = require('node:http');
const { sameOrigin } = require('./office-access.cjs');

async function proxyWordTools(request, response, service) {
  if (!sameOrigin(request)) {
    response.writeHead(403); response.end('Office application only'); return;
  }
  const limit = 64 * 1024 * 1024;
  if (Number(request.headers['content-length']) > limit) {
    response.writeHead(413); response.end('Request too large'); return;
  }
  try {
    const { url } = await service.ensureStarted();
    const backend = new URL(url);
    if (backend.hostname !== '127.0.0.1' || backend.protocol !== 'http:') throw new Error('Invalid geometry service address');
    const target = new URL(request.url.replace(/^\/word-tools\//, '/'), backend);
    if (target.origin !== backend.origin) throw new Error('Invalid workbench path');
    const headers = { ...request.headers, host: backend.host, origin: backend.origin };
    delete headers.connection; delete headers['transfer-encoding']; delete headers.cookie; delete headers.authorization;
    const upstream = http.request(target, { method: request.method, headers }, result => {
      const resultHeaders = { ...result.headers, 'cache-control': 'no-store' };
      delete resultHeaders.connection; delete resultHeaders['transfer-encoding'];
      if (response.destroyed || response.writableEnded) { result.destroy(); return; }
      response.writeHead(result.statusCode, resultHeaders);
      result.pipe(response);
    });
    upstream.setTimeout(180000, () => upstream.destroy(new Error('Geometry request timed out')));
    upstream.on('error', () => {
      if (!response.headersSent && !response.writableEnded) { response.writeHead(502); response.end('Geometry service unavailable'); }
      else if (!response.writableEnded) response.destroy();
    });
    let received = 0;
    request.on('data', chunk => {
      received += chunk.length;
      if (received > limit && !response.headersSent) {
        response.writeHead(413); response.end('Request too large'); upstream.destroy();
      }
    });
    request.on('aborted', () => upstream.destroy());
    response.on('close', () => { if (!response.writableEnded) upstream.destroy(); });
    request.pipe(upstream);
  } catch {
    if (!response.headersSent) { response.writeHead(503); response.end('Geometry service could not start'); }
  }
}
module.exports = { proxyWordTools };
