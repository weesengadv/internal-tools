import { test } from 'node:test';
import assert from 'node:assert/strict';

const appearance = await import('../src/appearance.mjs').catch(() => ({}));

test('preferences use the system theme and reject invalid persisted choices', () => {
  assert.equal(typeof appearance.readPreferences, 'function');
  const values = new Map([['weesengTheme', 'invalid'], ['gcodeEditorLanguage', 'bad']]);
  const storage = { getItem: key => values.get(key) };
  assert.deepEqual(appearance.readPreferences(storage, true), { theme: 'dark', language: 'en' });
  values.set('weesengTheme', 'light');
  values.set('gcodeEditorLanguage', 'cn');
  assert.deepEqual(appearance.readPreferences(storage, true), { theme: 'light', language: 'cn' });
});

test('blocked storage does not prevent opening the app', () => {
  assert.equal(typeof appearance.readPreferences, 'function');
  assert.deepEqual(appearance.readPreferences({ getItem() { throw new Error('blocked'); } }, false), { theme: 'light', language: 'en' });
});

test('embedded preferences accept only the defined language and theme values', () => {
  assert.equal(typeof appearance.validPreferences, 'function');
  assert.equal(appearance.validPreferences({ theme: 'dark', language: 'cn' }), true);
  assert.equal(appearance.validPreferences({ theme: 'auto', language: 'cn' }), false);
  assert.equal(appearance.validPreferences({ theme: 'dark', language: 'fr' }), false);
  assert.equal(appearance.validPreferences(null), false);
});

test('theme toggle persists, updates its accessible name and follows system changes only until explicitly chosen', async () => {
  const { JSDOM } = await import('../tools/word-tools/node_modules/jsdom/lib/api.js');
  const dom = new JSDOM('<button id="themeToggle"><span data-theme-icon></span></button>', { url: 'http://localhost/' });
  let systemChange;
  dom.window.matchMedia = () => ({ matches: false, addEventListener(_, fn) { systemChange = fn; } });
  const previous = { window: globalThis.window, document: globalThis.document, CustomEvent: globalThis.CustomEvent };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, CustomEvent: dom.window.CustomEvent });
  try {
    const controller = appearance.initAppearance();
    systemChange({ matches: true });
    assert.equal(controller.preferences.theme, 'dark');
    dom.window.document.querySelector('button').click();
    assert.equal(dom.window.localStorage.getItem('weesengTheme'), 'light');
    systemChange({ matches: true });
    assert.equal(controller.preferences.theme, 'light');
    controller.setLanguage('cn');
    assert.equal(dom.window.document.querySelector('button').getAttribute('aria-label'), '切换夜间模式');
    assert.equal(dom.window.document.documentElement.dataset.theme, 'light');
  } finally { Object.assign(globalThis, previous); dom.window.close(); }
});
