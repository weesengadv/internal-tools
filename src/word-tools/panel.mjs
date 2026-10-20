import { validPreferences } from '../appearance.mjs';

export function initWordTools(workspace, { fetchImpl = fetch } = {}) {
  const frame = workspace.querySelector('iframe');
  const status = workspace.querySelector('.word-tools-status');
  const message = workspace.querySelector('.word-tools-message');
  const retry = workspace.querySelector('#wordToolsRetry');
  const connection = workspace.querySelector('.word-tools-connection');
  const reconnectButton = workspace.querySelector('#wordToolsReconnect');
  let opening = null;
  let loaded = false;
  let preferences = { theme: 'light', language: 'en' };
  let lastError = '';
  function sync() {
    if (!frame.src) return;
    frame.contentWindow?.postMessage({ type: 'weeseng-preferences', ...preferences }, new URL(frame.src).origin);
  }
  function localizeError(text) {
    if (preferences.language !== 'cn') return text;
    if (/does not include/.test(text)) return '当前运行的服务不包含 3D 立体字工具。请打开更新后的生产工具后重试。';
    if (/unexpected response/.test(text)) return `立体字工具返回了异常响应（${text.match(/HTTP \d+/)?.[0] || 'HTTP'}）。请重启生产工具后重试。`;
    if (/too long/.test(text)) return '工作台打开超时，请重试。';
    if (/could not load/.test(text)) return '无法载入工作台，请重试。';
    if (/Invalid local/.test(text)) return '本地工作台地址无效。';
    return '无法启动 3D 立体字工具。请检查本机 Python 环境及工具安装文件后重试。';
  }
  function labels() {
    const cn = preferences.language === 'cn';
    retry.textContent = cn ? '重试' : 'Retry';
    reconnectButton.textContent = cn ? '重新连接' : 'Reconnect';
    message.textContent = lastError ? localizeError(lastError) : cn ? '正在打开 3D 立体字工具…' : 'Opening 3D word tools…';
    const heading = workspace.querySelector('.word-tools-status h2');
    if (heading) heading.textContent = cn ? '3D 立体字工具' : '3D word tools';
    const caption = workspace.querySelector('.word-tools-connection span');
    if (caption) caption.textContent = cn ? 'DXF · STL 工作台' : 'DXF · STL workbench';
    frame.title = cn ? '3D 立体字工具 — DXF 字形工作台' : '3D word tools — DXF letter workbench';
  }
  globalThis.window?.addEventListener('message', event => {
    if (frame.src && event.source === frame.contentWindow && event.origin === new URL(frame.src).origin && event.data?.type === 'weeseng-preferences-ready') sync();
  });

  async function open({ reconnect = false } = {}) {
    if ((loaded && !reconnect) || opening) return opening;
    status.hidden = loaded;
    reconnectButton.disabled = true;
    retry.hidden = true;
    lastError = '';
    labels();
    opening = (async () => {
      try {
        const response = await fetchImpl('/api/word-tools/start', { method: 'POST' });
        if (response.status === 404) {
          throw new Error('This running server does not include 3D word tools. Open the updated Production Tools app, then retry.');
        }
        let data;
        try { data = await response.json(); }
        catch {
          throw new Error(`3D word tools received an unexpected response (HTTP ${response.status}). Restart Production Tools and retry.`);
        }
        if (!response.ok) throw new Error(data.error || '3D word tools could not start.');
        const base = globalThis.window?.location?.href || 'http://127.0.0.1/';
        const url = new URL(data.url, base);
        const own = new URL(base);
        const proxied = url.origin === own.origin && url.pathname === '/word-tools/' && !url.search && !url.hash;
        const legacyLocal = own.hostname === '127.0.0.1' && url.protocol === 'http:' && url.hostname === '127.0.0.1';
        if (!proxied && !legacyLocal) throw new Error('Invalid local workbench address.');
        if (loaded && frame.src === url.href) return;
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { cleanup(); reject(new Error('The workbench took too long to open. Please retry.')); }, 30000);
          const cleanup = () => { clearTimeout(timer); frame.onload = null; frame.onerror = null; };
          frame.onload = () => { cleanup(); sync(); resolve(); };
          frame.onerror = () => { cleanup(); reject(new Error('The workbench could not load. Please retry.')); };
          frame.src = url.href;
        });
        loaded = true;
        frame.hidden = false;
        status.hidden = true;
        connection.hidden = false;
      } catch (error) {
        status.hidden = false;
        lastError = error.message;
        labels();
        retry.hidden = false;
      } finally { opening = null; reconnectButton.disabled = false; }
    })();
    return opening;
  }
  retry.addEventListener('click', () => open({ reconnect: true }));
  reconnectButton.addEventListener('click', () => open({ reconnect: true }));
  return { open, setPreferences(value) {
    if (!validPreferences(value)) return;
    preferences = { theme: value.theme, language: value.language };
    labels();
    sync();
  } };
}
