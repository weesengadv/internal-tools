const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { createWordToolsService } = require('../src/server/word-tools-service.cjs');

test('concurrent requests share one ready service; shutdown stops the child', async () => {
  const service = createWordToolsService({
    appDir: path.resolve('tools/word-tools'),
    candidates: [{ command: process.execPath, args: [path.join(__dirname, 'fixtures/word-service.cjs')] }]
  });
  try {
    const [first, second] = await Promise.all([service.ensureStarted(), service.ensureStarted()]);
    assert.equal(first.url, second.url);
    assert.match(first.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    assert.equal((await fetch(first.url + 'api/health')).status, 200);
    assert.deepEqual(await service.ensureStarted(), first);
    await service.stop();
    await assert.rejects(fetch(first.url + 'api/health'));
  } finally { await service.stop(); }
});

test('missing app files report an actionable installation error', async () => {
  const service = createWordToolsService({ appDir: path.join(__dirname, 'missing-word-tools') });
  await assert.rejects(service.ensureStarted(), /3D word tools.*missing/i);
  await service.stop();
});

test('failed Python launch can be retried without a stuck startup promise', async () => {
  const service = createWordToolsService({
    appDir: path.resolve('tools/word-tools'),
    candidates: [{ command: 'missing-word-tools-python-executable', args: [] }],
    startupTimeout: 1000
  });
  await assert.rejects(service.ensureStarted(), /Python|dependencies/i);
  await assert.rejects(service.ensureStarted(), /Python|dependencies/i);
  await service.stop();
});
