const crypto = require('node:crypto');
const MAX_PACKAGE_BYTES = 1024 * 1024 * 1024;
function metadata(value) {
  if (!value || !/^office-[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(value.release) || !/^[a-f0-9]{64}$/.test(value.sha256) || !Number.isSafeInteger(value.bytes) || value.bytes <= 0 || value.bytes > MAX_PACKAGE_BYTES) throw new Error('Invalid signed release metadata.');
  return { release: value.release, sha256: value.sha256, bytes: value.bytes };
}
function canonical(value) { return Buffer.from(JSON.stringify({ protocol: 'weeseng-office-update-v1', ...metadata(value) })); }
function signRelease(value, privateKey) {
  return { ...metadata(value), signature: crypto.sign(null, canonical(value), privateKey).toString('base64') };
}
function verifyRelease(value, publicKey) {
  if (!value || Object.keys(value).sort().join(',') !== 'bytes,release,sha256,signature' || typeof value.signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(value.signature)) throw new Error('Invalid signed update envelope.');
  const parsed = metadata(value);
  if (!crypto.verify(null, canonical(parsed), publicKey, Buffer.from(value.signature, 'base64'))) throw new Error('Update signature does not match this publisher.');
  return parsed;
}
function keyFingerprint(key) {
  return crypto.createHash('sha256').update((key?.type === 'public' ? key : crypto.createPublicKey(key)).export({ type: 'spki', format: 'der' })).digest('hex');
}
module.exports = { signRelease, verifyRelease, keyFingerprint, MAX_PACKAGE_BYTES };
if (require.main === module) console.log(keyFingerprint(require('node:fs').readFileSync(process.argv[2])));
