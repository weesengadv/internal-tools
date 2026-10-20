const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

function freePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
  });
}

function createWordToolsService(options = {}) {
  const appDir = options.appDir;
  const executable = process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python'];
  const candidates = options.candidates || [
    ...(process.env.WEESENG_WORD_TOOLS_PYTHON ? [{ command: process.env.WEESENG_WORD_TOOLS_PYTHON, args: [] }] : []),
    { command: path.join(appDir, '.venv', ...executable), args: [] },
    { command: path.join(options.configDir || appDir, 'word-tools-env', ...executable), args: [] },
    { command: 'py', args: ['-3'] },
    { command: 'python', args: [] },
    { command: 'python3', args: [] }
  ];
  let child = null;
  let ready = null;
  let starting = null;
  let stopped = false;

  async function healthy(url) {
    try {
      const response = await fetch(url + 'api/health', { signal: AbortSignal.timeout(500) });
      const data = await response.json();
      return response.ok && data.ok === true && data.local === true;
    } catch { return false; }
  }

  async function terminate(processToStop) {
    if (!processToStop || processToStop.exitCode !== null || processToStop.signalCode) return;
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 2000);
      processToStop.once('exit', () => { clearTimeout(timer); resolve(); });
      processToStop.kill();
    });
  }

  async function launch() {
    if (!fs.existsSync(path.join(appDir, 'backend', 'main.py')) || !fs.existsSync(path.join(appDir, 'dist', 'client', 'index.html'))) {
      throw new Error('3D word tools installation is missing. Restore the tools/word-tools application folder.');
    }
    let details = '';
    for (const candidate of candidates) {
      if (stopped) throw new Error('3D word tools service has stopped.');
      const port = await freePort();
      const url = `http://127.0.0.1:${port}/`;
      let exited = false;
      let output = '';
      const processToStart = spawn(candidate.command, [...candidate.args,
        '-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', String(port)
      ], { cwd: appDir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PYTHONUNBUFFERED: '1' } });
      child = processToStart;
      const capture = chunk => { output = (output + chunk.toString()).slice(-3000); };
      processToStart.stdout.on('data', capture);
      processToStart.stderr.on('data', capture);
      processToStart.on('error', error => { exited = true; output = error.message; });
      processToStart.on('exit', () => {
        exited = true;
        if (child === processToStart) { ready = null; child = null; }
      });
      const deadline = Date.now() + (options.startupTimeout || 30000);
      while (!stopped && !exited && Date.now() < deadline) {
        if (await healthy(url)) {
          if (stopped || exited) break;
          ready = { url };
          return ready;
        }
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      await terminate(processToStart);
      if (child === processToStart) child = null;
      details = output || 'Service startup timed out.';
    }
    throw new Error('3D word tools could not start. Install Python and the dependencies in tools/word-tools/backend/requirements.txt, then retry. ' + details);
  }

  return {
    async ensureStarted() {
      if (stopped) throw new Error('3D word tools service has stopped.');
      if (ready && child) return ready;
      if (!starting) starting = launch().finally(() => { starting = null; });
      return starting;
    },
    async stop() {
      stopped = true;
      ready = null;
      await terminate(child);
      if (starting) await starting.catch(() => {});
      child = null;
    }
  };
}

module.exports = { createWordToolsService };
