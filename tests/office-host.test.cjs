const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const { createWeesengServer } = require('../server.js');

test('office mode only accepts its configured hosts/subnet and same-origin browser requests', async () => {
  const server = createWeesengServer({ office: { address: '192.168.0.234', subnet: '192.168.0.0/24' } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base + '/api/health')).status, 200);
    const forbiddenHost = await new Promise((resolve, reject) => {
      http.get(base + '/api/health', { headers: { Host: 'untrusted.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(forbiddenHost, 403);
    assert.equal((await fetch(base + '/api/word-tools/start', { method: 'POST', headers: { origin: 'https://untrusted.example' } })).status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('workbench proxy forwards multipart and binary bodies on the same browser origin', async () => {
  const backend = http.createServer((req, res) => {
    let body = Buffer.alloc(0);
    req.on('data', chunk => { body = Buffer.concat([body, chunk]); });
    req.on('end', () => {
      assert.match(req.headers.host, /^127\.0\.0\.1:/);
      assert.match(req.headers.origin, /^http:\/\/127\.0\.0\.1:/);
      if (req.url === '/api/import') {
        assert.match(req.headers['content-type'], /multipart\/form-data/);
        assert.ok(body.includes(Buffer.from('DXF-SENTINEL')));
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ parts: [1, 2] }));
      } else if (req.url === '/api/export/stl') {
        res.setHeader('content-type', 'application/zip');
        res.setHeader('content-disposition', 'attachment; filename=parts.zip');
        res.end(Buffer.from([0x50, 0x4b, 0, 255]));
      } else { res.end('workbench'); }
    });
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const server = createWeesengServer({ wordToolsService: {
    async ensureStarted() { return { url: `http://127.0.0.1:${backend.address().port}/` }; }, async stop() {}
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const started = await fetch(base + '/api/word-tools/start', { method: 'POST' });
    assert.deepEqual(await started.json(), { url: '/word-tools/' });
    const form = new FormData(); form.set('file', new Blob(['DXF-SENTINEL']), 'letters.dxf');
    const imported = await fetch(base + '/word-tools/api/import', { method: 'POST', body: form, headers: { origin: base } });
    assert.equal(imported.status, 200);
    assert.deepEqual(await imported.json(), { parts: [1, 2] });
    const exported = await fetch(base + '/word-tools/api/export/stl', { method: 'POST', body: '{}', headers: { origin: base, 'content-type': 'application/json' } });
    assert.equal(exported.headers.get('content-type'), 'application/zip');
    assert.deepEqual(Buffer.from(await exported.arrayBuffer()), Buffer.from([0x50, 0x4b, 0, 255]));
  } finally { await new Promise(resolve => server.close(resolve)); await new Promise(resolve => backend.close(resolve)); }
});
