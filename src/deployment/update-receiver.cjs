const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const { verifyRelease } = require('./update-signing.cjs');

const ACTIVE = new Set(['receiving', 'verified', 'installing']);
function atomicJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.new'; fs.writeFileSync(temp, JSON.stringify(data, null, 2)); fs.renameSync(temp, file);
}
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; } }
function publicJob(job) {
  if (!job) return null;
  const { id, release, status, bytes, receivedBytes, startedAt, updatedAt, error } = job;
  return { id, release, status, bytes, receivedBytes, startedAt, updatedAt, error };
}
function createUpdateReceiver(config, options = {}) {
  const directory = path.resolve(config.directory);
  const stateDir = path.join(directory, 'state');
  const inbox = path.join(directory, 'inbox');
  fs.mkdirSync(stateDir, { recursive: true }); fs.mkdirSync(inbox, { recursive: true });
  const key = crypto.createPublicKey(config.publicKey);
  let activeId = readJson(path.join(stateDir, 'latest.json'))?.id || null;
  const jobFile = id => path.join(stateDir, id + '.json');
  const current = () => activeId && readJson(jobFile(activeId));
  // Unverified interrupted uploads must never become executable updates.
  if (['receiving', 'verified'].includes(current()?.status)) {
    const job = current(); job.status = 'failed'; job.error = 'Upload interrupted. No update was installed.'; job.updatedAt = new Date().toISOString(); atomicJson(jobFile(job.id), job);
  }
  function save(job) { job.updatedAt = new Date().toISOString(); atomicJson(jobFile(job.id), job); }
  function reconcile() {
    const job = current();
    if (job?.status !== 'installing' || options.applyUpdate) return;
    // A live trusted wrapper may outlive the receiver. Never launch a second installer.
    const alive = execFileSync('powershell.exe', ['-NoProfile', '-Command', '$p = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "powershell.exe" -and $_.CommandLine -like "*apply-update.ps1*" -and $_.CommandLine.Contains($env:WEESENG_CHECK_JOB) }; if ($p) { "alive" }'], { windowsHide: true, encoding: 'utf8', env: { ...process.env, WEESENG_CHECK_JOB: job.id }, timeout: 15000 }).trim();
    if (!alive) { job.status = 'failed'; job.error = 'Office restarted or the installer stopped. Check the office application and setup log before retrying.'; save(job); }
  }
  function send(response, status, body) {
    if (response.destroyed || response.writableEnded) return;
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(body));
  }
  function authorized(request) {
    const address = (request.socket.remoteAddress || '').replace(/^::ffff:/, '');
    const [subnet, prefix] = config.subnet.split('/');
    const allowed = new net.BlockList(); allowed.addSubnet(subnet, Number(prefix), 'ipv4');
    if (address !== '127.0.0.1' && address !== '::1' && (!net.isIPv4(address) || !allowed.check(address, 'ipv4'))) return false;
    // No browser-origin requests are accepted by the privileged receiver.
    if (request.headers.origin) return false;
    const actual = crypto.createHash('sha256').update(request.headers.authorization || '').digest();
    const expected = crypto.createHash('sha256').update('Bearer ' + config.token).digest();
    return crypto.timingSafeEqual(actual, expected);
  }
  function runApply(job, archive) {
    if (options.applyUpdate) return options.applyUpdate(job, archive, updated => save({ ...job, ...updated }));
    return new Promise((resolve, reject) => {
      const log = fs.openSync(path.join(stateDir, job.id + '.log'), 'a');
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(directory, 'apply-update.ps1'),
        '-InstallDir', config.installDir, '-Archive', archive, '-JobFile', jobFile(job.id), '-Release', job.release, '-ExpectedHash', job.sha256
      ], { windowsHide: true, stdio: ['ignore', log, log] });
      fs.closeSync(log);
      child.once('error', reject);
      child.once('exit', code => {
        const result = readJson(jobFile(job.id));
        if (code === 0 && result && !ACTIVE.has(result.status)) resolve();
        else reject(new Error(result?.error || 'The update installer stopped unexpectedly. Check the office host update log.'));
      });
    });
  }
  async function handle(request, response) {
    if (!authorized(request)) { send(response, 401, { error: 'Receiver authentication required.' }); return; }
    reconcile();
    if (request.method === 'GET' && request.url === '/v1/status') {
      const pointer = readJson(path.join(config.installDir, 'current.json'));
      send(response, 200, { receiver: 'weeseng-office-v1', release: pointer?.release || null, job: publicJob(current()) }); return;
    }
    if (request.method !== 'POST' || request.url !== '/v1/releases') { send(response, 404, { error: 'Unknown update action.' }); return; }
    if (ACTIVE.has(current()?.status)) { send(response, 409, { error: 'An office update is already in progress.' }); return; }
    if (request.headers['x-weeseng-staff-saved'] !== 'yes') { send(response, 400, { error: 'Confirm staff have saved their work before installing.' }); return; }
    let release;
    try {
      const encoded = request.headers['x-weeseng-release'];
      if (typeof encoded !== 'string' || encoded.length > 2048) throw new Error('Missing signed update metadata.');
      release = verifyRelease(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')), key);
      if (request.headers['content-type'] !== 'application/zip' || Number(request.headers['content-length']) !== release.bytes) throw new Error('Update length or content type does not match its signature.');
    } catch (error) { send(response, 400, { error: error.message }); return; }
    const id = crypto.randomUUID();
    const archive = path.join(inbox, id + '.zip');
    const job = { id, ...release, status: 'receiving', receivedBytes: 0, startedAt: new Date().toISOString(), error: null };
    activeId = id; save(job); atomicJson(path.join(stateDir, 'latest.json'), { id });
    const hash = crypto.createHash('sha256'); let lastPersisted = 0;
    try {
      await pipeline(request, new Transform({ transform(chunk, _encoding, callback) {
        job.receivedBytes += chunk.length;
        if (job.receivedBytes > release.bytes) { callback(new Error('Update exceeds its signed size.')); return; }
        hash.update(chunk);
        if (job.receivedBytes - lastPersisted > 4 * 1024 * 1024) { save(job); lastPersisted = job.receivedBytes; }
        callback(null, chunk);
      } }), fs.createWriteStream(archive, { flags: 'wx' }));
      if (job.receivedBytes !== release.bytes || hash.digest('hex') !== release.sha256) throw new Error('Update checksum does not match its signature. Nothing was installed.');
      job.status = 'verified'; save(job);
      send(response, 202, { job: publicJob(job) });
      setImmediate(async () => {
        try { await runApply(job, archive); }
        catch (error) {
          const final = readJson(jobFile(id));
          if (!final || ACTIVE.has(final.status)) { job.status = 'failed'; job.error = error.message; save(job); }
        }
      });
    } catch (error) {
      job.status = 'failed'; job.error = 'Upload failed verification or was interrupted. Nothing was installed.'; save(job);
      try { fs.unlinkSync(archive); } catch {}
      send(response, 400, { error: job.error });
    }
  }
  const server = https.createServer(options.tls || { pfx: fs.readFileSync(config.pfxFile), passphrase: config.pfxPassword, minVersion: 'TLSv1.2' }, (req, res) => {
    handle(req, res).catch(() => send(res, 500, { error: 'Receiver could not complete the request.' }));
  });
  server.requestTimeout = 15 * 60 * 1000;
  server.headersTimeout = 15000;
  return server;
}
if (require.main === module) {
  const directory = __dirname;
  const config = readJson(path.join(directory, 'receiver-config.json'));
  if (!config) throw new Error('Office receiver has not been configured.');
  config.directory = directory;
  config.publicKey = fs.readFileSync(path.join(directory, 'publisher-public.pem'), 'utf8');
  createUpdateReceiver(config).listen(config.port, config.address, () => console.log('Office update receiver ready.'));
}
module.exports = { createUpdateReceiver };
