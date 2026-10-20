const https = require('node:https');
const tls = require('node:tls');
const crypto = require('node:crypto');
function pinnedAgent(pairing) {
  const address = new URL(pairing.target);
  const agent = new https.Agent({ keepAlive: false });
  // Do not hand the socket to HTTP until its certificate has been pinned.
  // This ensures no authorization header or package byte is sent before trust.
  agent.createConnection = (_options, callback) => {
    let settled = false;
    const done = (error, socket) => { if (!settled) { settled = true; callback(error, socket); } };
    const socket = tls.connect({ host: address.hostname, port: Number(address.port || 443), rejectUnauthorized: false, minVersion: 'TLSv1.2' }, () => {
      const certificate = socket.getPeerCertificate();
      const actual = certificate.raw && crypto.createHash('sha256').update(certificate.raw).digest('hex');
      if (actual !== pairing.certificateSha256) {
        const error = new Error('Office receiver certificate changed. Pair again on the host PC before sending updates.');
        done(error); socket.destroy(); return;
      }
      socket.setTimeout(0); done(null, socket);
    });
    socket.setTimeout(10000, () => socket.destroy(new Error('Office receiver connection timed out.')));
    socket.once('error', error => done(error));
    return undefined;
  };
  return agent;
}
function requestReceiver(pairing, route, { method = 'GET', headers = {}, stream, onProgress } = {}) {
  const agent = pinnedAgent(pairing);
  return new Promise((resolve, reject) => {
    const request = https.request(new URL(route, pairing.target), { agent, method, headers: { ...headers, authorization: 'Bearer ' + pairing.token } }, response => {
      const chunks = []; let bytes = 0;
      response.on('data', chunk => { bytes += chunk.length; if (bytes > 65536) response.destroy(new Error('Unexpected receiver response size.')); else chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => {
        agent.destroy();
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (response.statusCode >= 400) throw new Error(data.error || 'Office receiver rejected the request.');
          resolve(data);
        } catch (error) { reject(error); }
      });
    });
    request.setTimeout(120000, () => request.destroy(new Error('Office receiver request timed out.')));
    request.on('error', error => { agent.destroy(); if (stream) stream.destroy(); reject(error); });
    if (stream) {
      let sent = 0;
      stream.on('data', chunk => { sent += chunk.length; onProgress?.(sent); });
      stream.on('error', error => request.destroy(error)); stream.pipe(request);
    } else request.end();
  });
}
module.exports = { requestReceiver };
