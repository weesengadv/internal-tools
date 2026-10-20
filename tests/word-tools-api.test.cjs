const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createWeesengServer } = require('../server.js');

test('Production Tools exposes the word-tools startup route as JSON on success and failure', async () => {
  let fail = false;
  const server = createWeesengServer({ wordToolsService: {
    async ensureStarted() {
      if (fail) throw new Error('Geometry service unavailable');
      return { url: 'http://127.0.0.1:54321/' };
    },
    async stop() {}
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/word-tools/start`;
    const started = await fetch(url, { method: 'POST' });
    assert.equal(started.status, 200);
    assert.match(started.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await started.json(), { url: '/word-tools/' });
    fail = true;
    const failed = await fetch(url, { method: 'POST' });
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { error: 'Geometry service unavailable' });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
