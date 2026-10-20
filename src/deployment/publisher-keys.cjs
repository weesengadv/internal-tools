const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
function ensurePublisherKey(root) {
  const folder = path.join(root, '.office-publisher');
  fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
  if (process.platform === 'win32') {
    const identity = execFileSync('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true });
    const sid = identity.match(/S-1-5-(?:\d+-)*\d+/)?.[0];
    if (!sid) throw new Error('Could not determine the publisher account.');
    execFileSync('icacls.exe', [folder, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'], { stdio: 'pipe', windowsHide: true });
  }
  const file = path.join(folder, 'private.pem');
  if (!fs.existsSync(file)) {
    const keys = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(file, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
  }
  const privateKey = crypto.createPrivateKey(fs.readFileSync(file));
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Unexpected publisher key type.');
  const publicPem = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  fs.writeFileSync(path.join(folder, 'public.pem'), publicPem);
  return { folder, privateKey, publicPem };
}
module.exports = { ensurePublisherKey };
