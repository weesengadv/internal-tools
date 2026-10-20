const fs = require('node:fs');
const path = require('node:path');
const { createPublisher } = require('../deployment/office-publisher.cjs');
function createPublisherApi(root, office) {
  const enabled = !office && fs.existsSync(path.join(root, 'scripts/package-office-host.cjs'));
  let publisher;
  return async (request, response, pathname) => {
    if (!pathname.startsWith('/api/office-publisher/') && pathname !== '/office-updates.html') return false;
    const reply = (code, value) => { response.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); response.end(JSON.stringify(value)); };
    const address = (request.socket.remoteAddress || '').replace(/^::ffff:/,'');
    const host = request.headers.host || '';
    if (!enabled || !['127.0.0.1','::1'].includes(address) || !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) { reply(404, { error: 'Office publishing is only available on the development PC.' }); return true; }
    if (request.headers.origin && request.headers.origin !== 'http://' + host) { reply(403, { error: 'Invalid publishing origin.' }); return true; }
    if (pathname === '/office-updates.html') { response.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-store'}); response.end(fs.readFileSync(path.join(root,'office-updates.html'))); return true; }
    publisher ||= createPublisher(root);
    try {
      if (request.method === 'GET' && pathname.endsWith('/status')) { reply(200,publisher.status()); return true; }
      if (request.method === 'GET' && pathname.endsWith('/receiver')) { reply(200,await publisher.receiverStatus()); return true; }
      if (request.method !== 'POST' || request.headers['content-type'] !== 'application/json') throw new Error('Use a JSON publishing action.');
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 16384) throw new Error('Publishing request too large.'); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      if (pathname.endsWith('/pair')) reply(200,publisher.pair(body));
      else if (pathname.endsWith('/build')) reply(202,publisher.build());
      else if (pathname.endsWith('/send')) reply(202,publisher.send(body.staffSaved));
      else reply(404,{error:'Unknown publishing action.'});
    } catch (error) { reply(400,{error:error.message}); }
    return true;
  };
}
module.exports = { createPublisherApi };
