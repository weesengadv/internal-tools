const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const payload = path.resolve(process.argv[2]);
const sourceDxf = process.argv[3];
process.env.WEESENG_APP_ROOT = path.join(payload, 'app');
process.env.WEESENG_CONFIG_DIR = path.resolve('output', 'office-package-smoke-settings');
process.env.WEESENG_WORD_TOOLS_ROOT = path.join(payload, 'app/tools/word-tools');
process.env.WEESENG_WORD_TOOLS_PYTHON = path.join(payload, 'runtime/python/python.exe');
process.env.WEESENG_OFFICE_ADDRESS = '192.168.0.234';
process.env.WEESENG_OFFICE_SUBNET = '192.168.0.0/24';
process.env.PYTHONDONTWRITEBYTECODE = '1';
delete process.env.PYTHONHOME;
delete process.env.PYTHONPATH;
const { startServer } = require(path.join(payload, 'app/server.js'));
(async () => {
  const { server, url } = await startServer({ port: 0, host: '127.0.0.1' });
  try {
    const page = await fetch(url); assert.equal(page.status, 200);
    assert.match(await page.text(), /Hole and 3D Print Word/);
    for (const name of ['signage-config.json', '.git/config', 'server.js', 'src/server/office-access.cjs']) {
      assert.equal((await fetch(url + name)).status, 403, name);
    }
    const startup = await fetch(url + 'api/word-tools/start', { method: 'POST' });
    assert.equal(startup.status, 200);
    assert.deepEqual(await startup.json(), { url: '/word-tools/' });
    const workbench = new URL('word-tools/', url).href;
    const html = await (await fetch(workbench)).text();
    const script = html.match(/src="(\.\/assets\/[^\"]+)"/);
    assert.ok(script, 'workbench assets must be relative');
    assert.equal((await fetch(new URL(script[1], workbench))).status, 200);
    const health = await (await fetch(workbench + 'api/health')).json();
    assert.ok(health.ok && health.local);
    const call = async (action, body) => {
      const response = await fetch(workbench + 'api/' + action, { method: 'POST', headers: { 'content-type': 'application/json', origin: new URL(url).origin }, body: JSON.stringify(body) });
      if (response.status !== 200) throw new Error(action + ': ' + response.status + ' ' + await response.text());
      return response;
    };
    if (sourceDxf) {
      const form = new FormData(); form.set('file', new Blob([fs.readFileSync(sourceDxf)]), path.basename(sourceDxf));
      const imported = await fetch(workbench + 'api/import', { method: 'POST', headers: { origin: new URL(url).origin }, body: form });
      assert.equal(imported.status, 200);
      console.log('Relocated package production DXF:', (await imported.json()).parts.length, 'parts');
    }
    const demo = await (await fetch(workbench + 'api/demo')).json();
    const a = structuredClone(demo), b = structuredClone(demo);
    a.parameters.baseThickness = 2;
    const [first, second] = await Promise.all([call('generate2d', { project: a, placeHoles: true }), call('generate2d', { project: b, placeHoles: true })]);
    const firstProject = await first.json(), secondProject = await second.json();
    assert.equal(firstProject.parameters.baseThickness, 2);
    assert.equal(secondProject.parameters.baseThickness, 1);
    const mesh = await (await call('model', { project: firstProject, partId: firstProject.parts[0].id })).json();
    assert.ok(mesh.watertight && mesh.faces.length);
    const exported = await call('export/stl', mesh.project);
    const bytes = Buffer.from(await exported.arrayBuffer());
    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    assert.ok(bytes.length > 1000);
    console.log('Relocated Node/Python package: web, file isolation, relative assets, independent projects, 3D and STL ZIP passed.', bytes.length, 'ZIP bytes');
  } finally {
    await server.stopWordTools();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
