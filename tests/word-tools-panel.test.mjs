import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initWordTools } from '../src/word-tools/panel.mjs';

function panel() {
  const nodes = Object.fromEntries(['iframe', '.word-tools-status', '.word-tools-message', '#wordToolsRetry', '.word-tools-connection', '#wordToolsReconnect'].map(key => [key, { hidden: true, addEventListener(type, fn) { this[type] = fn; } }]));
  let loads = 0, source = '';
  Object.defineProperty(nodes.iframe, 'src', {
    get() { return source; },
    set(value) { source = value; loads++; queueMicrotask(() => nodes.iframe.onload?.()); }
  });
  return { nodes, querySelector: key => nodes[key], get loads() { return loads; } };
}

test('switching tools keeps iframe state; reconnect reuses healthy service and reloads a replacement', async () => {
  const workspace = panel();
  let calls = 0, url = 'http://127.0.0.1:54321/';
  const controller = initWordTools(workspace, { fetchImpl: async () => {
    calls++;
    return { ok: true, json: async () => ({ url }) };
  } });
  await controller.open();
  await controller.open();
  assert.equal(calls, 1);
  assert.equal(workspace.loads, 1);
  assert.equal(workspace.nodes['.word-tools-connection'].hidden, false);
  await workspace.nodes['#wordToolsReconnect'].click();
  assert.equal(calls, 2);
  assert.equal(workspace.loads, 1, 'healthy reconnect retains the document and unsaved edits');
  url = 'http://127.0.0.1:54322/';
  await workspace.nodes['#wordToolsReconnect'].click();
  assert.equal(workspace.loads, 2);
  assert.equal(workspace.nodes.iframe.src, url);
});

test('startup failure offers retry and then shows a working frame', async () => {
  const workspace = panel();
  let fail = true;
  const controller = initWordTools(workspace, { fetchImpl: async () => ({
    ok: !fail, json: async () => fail ? { error: 'Python dependencies missing' } : { url: 'http://127.0.0.1:54321/' }
  }) });
  await controller.open();
  assert.equal(workspace.nodes['#wordToolsRetry'].hidden, false);
  assert.match(workspace.nodes['.word-tools-message'].textContent, /dependencies/);
  fail = false;
  await workspace.nodes['#wordToolsRetry'].click();
  assert.equal(workspace.nodes.iframe.hidden, false);
  assert.equal(workspace.nodes['.word-tools-status'].hidden, true);
});

test('an older server returning plain-text 404 explains the version mismatch and supports retry', async () => {
  const workspace = panel();
  let oldServer = true;
  const controller = initWordTools(workspace, { fetchImpl: async () => oldServer
    ? new Response('Not found', { status: 404 })
    : Response.json({ url: 'http://127.0.0.1:54321/' })
  });
  await controller.open();
  assert.match(workspace.nodes['.word-tools-message'].textContent, /updated Production Tools/i);
  assert.doesNotMatch(workspace.nodes['.word-tools-message'].textContent, /Unexpected token|valid JSON/);
  assert.equal(workspace.nodes['#wordToolsRetry'].hidden, false);
  oldServer = false;
  await workspace.nodes['#wordToolsRetry'].click();
  assert.equal(workspace.nodes.iframe.hidden, false);
});

test('non-JSON service failures report the HTTP status instead of a JSON parser exception', async () => {
  const workspace = panel();
  const controller = initWordTools(workspace, { fetchImpl: async () => new Response('Unavailable', { status: 503 }) });
  await controller.open();
  assert.match(workspace.nodes['.word-tools-message'].textContent, /HTTP 503/);
  assert.equal(workspace.nodes['#wordToolsRetry'].hidden, false);
});

test('theme and language changes reach the frame without reloading unsaved work', async () => {
  const workspace = panel(), sent = [];
  workspace.nodes.iframe.contentWindow = { postMessage(data, origin) { sent.push({ data, origin }); } };
  const controller = initWordTools(workspace, { fetchImpl: async () => Response.json({ url: 'http://127.0.0.1:54321/' }) });
  await controller.open();
  controller.setPreferences({ theme: 'dark', language: 'cn' });
  assert.equal(workspace.loads, 1);
  assert.deepEqual(sent.at(-1), { data: { type: 'weeseng-preferences', theme: 'dark', language: 'cn' }, origin: 'http://127.0.0.1:54321' });
  assert.equal(workspace.nodes['#wordToolsReconnect'].textContent, '重新连接');
  controller.setPreferences({ theme: 'invalid', language: 'cn' });
  assert.equal(sent.length, 2, 'invalid preferences are not forwarded');
});

test('office browsers open the workbench on the office origin rather than their own loopback', async () => {
  const previous = globalThis.window;
  globalThis.window = { location: { href: 'http://192.168.0.234:4174/' }, addEventListener() {} };
  try {
    const workspace = panel();
    const controller = initWordTools(workspace, { fetchImpl: async () => Response.json({ url: '/word-tools/' }) });
    await controller.open();
    assert.equal(workspace.nodes.iframe.src, 'http://192.168.0.234:4174/word-tools/');
    assert.equal(workspace.nodes.iframe.hidden, false);
    const rejected = panel();
    await initWordTools(rejected, { fetchImpl: async () => Response.json({ url: 'http://127.0.0.1:54321/' }) }).open();
    assert.match(rejected.nodes['.word-tools-message'].textContent, /Invalid local/);
  } finally { globalThis.window = previous; }
});
