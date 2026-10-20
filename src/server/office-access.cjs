const net = require('node:net');

function allowOfficeRequest(request, office) {
  if (!office) return true;
  const address = (request.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const allowed = new net.BlockList();
  const [subnet, prefix] = office.subnet.split('/');
  allowed.addSubnet(subnet, Number(prefix), 'ipv4');
  if (address !== '::1' && address !== '127.0.0.1' && (!net.isIPv4(address) || !allowed.check(address, 'ipv4'))) return false;
  try {
    const host = new URL('http://' + request.headers.host).hostname;
    if (!['127.0.0.1', 'localhost', office.address].includes(host)) return false;
  } catch { return false; }
  return sameOrigin(request);
}

function sameOrigin(request) {
  if (!request.headers.origin) return true;
  return request.headers.origin === 'http://' + request.headers.host;
}

module.exports = { allowOfficeRequest, sameOrigin };
