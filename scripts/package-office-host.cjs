const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const { ensurePublisherKey } = require('../src/deployment/publisher-keys.cjs');
const { signRelease, keyFingerprint } = require('../src/deployment/update-signing.cjs');
const publisher = ensurePublisherKey(root);
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Build this Windows x64 package on Windows x64.');
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
execFileSync(process.execPath, [npmCli, 'run', 'build', '--prefix', path.join(root, 'tools/word-tools')], { cwd: root, stdio: 'inherit' });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const release = 'office-' + stamp;
const stage = path.join(root, 'dist', 'Weeseng-Office-' + stamp);
if (fs.existsSync(stage)) throw new Error('This release folder already exists.');
const payload = path.join(stage, 'payload');
const app = path.join(payload, 'app');
const python = path.join(payload, 'runtime', 'python');
const venv = path.join(root, 'tools', 'word-tools', '.venv');
const pythonHome = fs.readFileSync(path.join(venv, 'pyvenv.cfg'), 'utf8').match(/^home\s*=\s*(.+)$/m)?.[1].trim();
if (!pythonHome || !fs.existsSync(path.join(pythonHome, 'python.exe'))) throw new Error('Python runtime is missing.');
const filter = source => !source.split(path.sep).some(segment => ['__pycache__', '.pytest_cache', '.git', '.venv', 'node_modules'].includes(segment));
function copy(source, destination, filtering = true) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, filter: filtering ? filter : undefined });
}
fs.mkdirSync(app, { recursive: true });
for (const name of ['server.js', 'app.js', 'index.html', 'styles.css', 'src', 'SIGNAGE_QUOTATION_MANUAL.html', 'signage-pricing-sample.csv']) copy(path.join(root, name), path.join(app, name));
for (const name of ['backend', 'dist/client']) copy(path.join(root, 'tools/word-tools', name), path.join(app, 'tools/word-tools', name));
for (const name of ['three', 'tesseract.js', 'tesseract.js-core', '@tesseract.js-data']) copy(path.join(root, 'node_modules', name), path.join(app, 'node_modules', name), false);
copy(process.execPath, path.join(payload, 'runtime', 'node.exe'));
const nodeLicense = path.join(path.dirname(process.execPath), 'LICENSE');
if (fs.existsSync(nodeLicense)) copy(nodeLicense, path.join(payload, 'runtime', 'NODE-LICENSE.txt'));
for (const item of fs.readdirSync(pythonHome)) {
  if (/^(python(?:w)?\.exe|python\d*\.dll|vcruntime.*\.dll|LICENSE\.txt)$/i.test(item) || ['Lib', 'DLLs'].includes(item)) copy(path.join(pythonHome, item), path.join(python, item));
}
fs.cpSync(path.join(venv, 'Lib/site-packages'), path.join(python, 'Lib/site-packages'), {
  recursive: true, filter: source => !source.split(path.sep).includes('__pycache__')
});
const config = JSON.parse(fs.readFileSync(path.join(root, 'signage-config.example.json'), 'utf8'));
config.apiKey = ''; config.googleSheetId = ''; config.googleSheetCsvUrl = ''; config.googleSheetTabs = [];
fs.writeFileSync(path.join(app, 'signage-config.example.json'), JSON.stringify(config, null, 2));
for (const name of ['SETUP_OFFICE.bat', 'UPDATE_OFFICE.bat', 'ROLLBACK_OFFICE.bat']) copy(path.join(root, 'office-host', name), path.join(stage, name));
for (const name of ['host.ps1', 'install.ps1', 'setup-receiver.ps1', 'apply-update.ps1', 'extract-update.ps1', 'receiver-host.ps1']) copy(path.join(root, 'office-host', name), path.join(stage, 'office', name));
for (const name of ['update-receiver.cjs', 'update-signing.cjs']) copy(path.join(root, 'src/deployment', name), path.join(stage, 'office', name));
fs.writeFileSync(path.join(stage, 'office/publisher-public.pem'), publisher.publicPem);
copy(path.join(root, 'office-host/README.txt'), path.join(stage, 'READ_ME_FIRST.txt'));
const files = [];
function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected link in package.');
    if (entry.isDirectory()) scan(file);
    else files.push({ path: path.relative(payload, file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
}
scan(payload);
if (files.some(file => /^app\/(signage-config\.json|\.git|data|logs|source-dxf|production|LetterForm_Transfer[^/]*)(\/|$)/i.test(file.path))) throw new Error('Private files were accidentally staged.');
fs.writeFileSync(path.join(payload, 'manifest.json'), JSON.stringify({ release, arch: 'win-x64', builtAt: new Date().toISOString(), node: process.version, files }, null, 2));
// An isolated invocation proves this runtime does not depend on the developer's venv.
execFileSync(path.join(python, 'python.exe'), ['-I', '-B', '-c', 'import sys,uvicorn,fastapi,ezdxf,shapely,scipy,numpy,trimesh,manifold3d,mapbox_earcut;print("Relocated Python runtime verified:",sys.prefix)'], { stdio: 'inherit', env: { ...process.env, PYTHONHOME: python, PYTHONNOUSERSITE: '1', PYTHONPATH: '' } });
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(stage, 'office/install.ps1'), '-ValidateOnly'], { stdio: 'inherit' });
const zip = stage + '.zip';
execFileSync('powershell.exe', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory($env:WEESENG_PACKAGE_STAGE, $env:WEESENG_PACKAGE_ZIP, [IO.Compression.CompressionLevel]::Fastest, $false)"], {
  stdio: 'inherit', env: { ...process.env, WEESENG_PACKAGE_STAGE: stage, WEESENG_PACKAGE_ZIP: zip }
});
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
fs.writeFileSync(zip + '.sha256.txt', sha256 + '  ' + path.basename(zip) + '\n');
const signatureFile = zip + '.signature.json';
fs.writeFileSync(signatureFile, JSON.stringify(signRelease({ release, sha256, bytes: fs.statSync(zip).size }, publisher.privateKey), null, 2));
fs.writeFileSync(path.join(root, 'dist', 'office-host-latest.json'), JSON.stringify({ release, stage, zip, sha256, signatureFile, publisherFingerprint: keyFingerprint(publisher.privateKey) }, null, 2));
console.log(JSON.stringify({ release, zip, megabytes: Math.round(fs.statSync(zip).size / 1048576), files: files.length }, null, 2));
