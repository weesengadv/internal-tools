const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { ensurePublisherKey } = require('./publisher-keys.cjs');
const { keyFingerprint, signRelease } = require('./update-signing.cjs');
const { requestReceiver } = require('./pinned-client.cjs');
function createPublisher(root) {
  let job = null;
  const folder = path.join(root, '.office-publisher');
  const read = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; } };
  const latest = () => read(path.join(root, 'dist/office-host-latest.json'));
  const pairing = () => read(path.join(folder, 'receiver.json'));
  function status() { const release = latest(); return { available: true, paired: !!pairing(), target: '192.168.0.234', release: release?.release || null, bytes: release && fs.existsSync(release.zip) ? fs.statSync(release.zip).size : null, job }; }
  function pair(value) {
    const keys = ensurePublisherKey(root);
    if (value?.version !== 1 || value.target !== 'https://192.168.0.234:4175' || !/^[a-f0-9]{64}$/.test(value.certificateSha256) || !/^[A-Za-z0-9+/]{43}=$/.test(value.token) || value.publisherKeySha256 !== keyFingerprint(keys.privateKey)) throw new Error('This pairing file does not match this publishing PC and office receiver.');
    fs.writeFileSync(path.join(folder, 'receiver.json'), JSON.stringify({ version: 1, target: value.target, certificateSha256: value.certificateSha256, token: value.token, publisherKeySha256: value.publisherKeySha256 }), { mode: 0o600 });
    return status();
  }
  function busy() { if (job && ['building','uploading','installing'].includes(job.status)) throw new Error('An update operation is already running.'); }
  function build() {
    busy(); job = { status: 'building', message: 'Building the current software. This can take a few minutes.' };
    const logDir = path.join(root, 'output'); fs.mkdirSync(logDir, { recursive: true });
    const log = fs.openSync(path.join(logDir, 'office-publisher-build.log'), 'w');
    const child = spawn(process.execPath, [path.join(root, 'scripts/package-office-host.cjs')], { cwd: root, windowsHide: true, stdio: ['ignore',log,log] }); fs.closeSync(log);
    child.once('error', error => { job = { status: 'failed', message: error.message }; });
    child.once('exit', code => { job = { status: code === 0 ? 'ready' : 'failed', message: code === 0 ? 'Update package ready. Review it, then send when staff have saved their work.' : 'Build failed. See output/office-publisher-build.log.' }; });
    return status();
  }
  function send(saved) {
    busy(); if (saved !== true) throw new Error('Confirm staff have saved their work.');
    const receiver = pairing(); if (!receiver) throw new Error('Pair the office receiver first.');
    const release = latest(); if (!release || !fs.existsSync(release.zip)) throw new Error('Build an update first.');
    // The archive is rehashed immediately before signing; no caller supplies paths or commands.
    const keys = ensurePublisherKey(root);
    if (receiver.publisherKeySha256 !== keyFingerprint(keys.privateKey)) throw new Error('Publisher key no longer matches this receiver.');
    job = { status: 'uploading', release: release.release, percent: 0, message: 'Checking and sending update.' };
    (async () => {
      const hash = crypto.createHash('sha256');
      for await (const chunk of fs.createReadStream(release.zip)) hash.update(chunk);
      const bytes = fs.statSync(release.zip).size;
      const digest = hash.digest('hex');
      if (digest !== release.sha256) throw new Error('The built ZIP has changed. Build it again.');
      const envelope = signRelease({ release: release.release, sha256: digest, bytes }, keys.privateKey);
      const reply = await requestReceiver(receiver, '/v1/releases', { method: 'POST', headers: { 'content-type': 'application/zip', 'content-length': bytes, 'x-weeseng-release': Buffer.from(JSON.stringify(envelope)).toString('base64url'), 'x-weeseng-staff-saved': 'yes' }, stream: fs.createReadStream(release.zip), onProgress: sent => { job.percent = Math.min(100, Math.round(sent / bytes * 100)); } });
      const id = reply.job.id; job.status = 'installing'; job.message = 'Office PC is verifying and installing. Keep this server running.';
      const deadline = Date.now() + 30 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 2500));
        const result = await requestReceiver(receiver, '/v1/status');
        if (result.job?.id !== id) throw new Error('Office job changed. Check receiver status before retrying.');
        if (['succeeded','failed'].includes(result.job.status)) { job = { status: result.job.status, release: release.release, message: result.job.error || 'Office PC updated successfully. Staff can refresh the tools page.' }; return; }
      }
      throw new Error('Office update is taking longer than expected. Check receiver status before retrying.');
    })().catch(error => { job = { status: 'failed', message: error.message }; });
    return status();
  }
  async function receiverStatus() { const value = pairing(); if (!value) throw new Error('Pair the office receiver first.'); return requestReceiver(value, '/v1/status'); }
  return { status, pair, build, send, receiverStatus };
}
module.exports = { createPublisher };
