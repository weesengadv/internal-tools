const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { signRelease, verifyRelease } = require('../src/deployment/update-signing.cjs');
test('signed release metadata is bound to its release, hash and length', () => {
  const keys = crypto.generateKeyPairSync('ed25519');
  const release = { release: 'office-20261020T120000Z', sha256: 'a'.repeat(64), bytes: 1024 };
  const signed = signRelease(release, keys.privateKey);
  assert.deepEqual(verifyRelease(signed, keys.publicKey), release);
  assert.throws(() => verifyRelease({ ...signed, release: release.release + '-changed' }, keys.publicKey));
  assert.throws(() => verifyRelease({ ...signed, sha256: 'b'.repeat(64) }, keys.publicKey));
  assert.throws(() => verifyRelease({ ...signed, bytes: release.bytes + 1 }, keys.publicKey));
  assert.throws(() => verifyRelease(signed, crypto.generateKeyPairSync('ed25519').publicKey));
});
test('metadata rejects unknown fields, unsafe release IDs and excessive package sizes', () => {
  const keys = crypto.generateKeyPairSync('ed25519');
  const release = { release: 'office-test', sha256: 'a'.repeat(64), bytes: 10 };
  assert.throws(() => signRelease({ ...release, release: '../escape' }, keys.privateKey));
  assert.throws(() => signRelease({ ...release, bytes: 2 ** 31 }, keys.privateKey));
  const signed = signRelease(release, keys.privateKey);
  assert.throws(() => verifyRelease({ ...signed, command: 'untrusted script' }, keys.publicKey));
});
