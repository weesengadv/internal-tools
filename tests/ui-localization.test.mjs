import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { extraMessages, uiText, localizeSystemText, localizeQuoteText, localizeCatalogLabel } from '../src/ui-translations.mjs';
import { translations, translate } from '../tools/word-tools/src/i18n.mjs';

test('every application message has both languages and matching placeholders', () => {
  const source = fs.readFileSync(new URL('../src/app-main.js', import.meta.url), 'utf8');
  const start = source.indexOf('const messages ='), end = source.indexOf('if (!["resume-print"', start);
  const context = { activeLanguage: 'en', extraMessages };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + ';globalThis.dictionary = messages;', context);
  const { en, cn } = context.dictionary;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(cn).sort());
  for (const key of Object.keys(en)) {
    assert.ok(cn[key].trim(), `Missing CN: ${key}`);
    assert.deepEqual((en[key].match(/\{\w+\}/g) || []).sort(), (cn[key].match(/\{\w+\}/g) || []).sort(), `Placeholder mismatch: ${key}`);
  }
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const literals = new Set(uiText.flat());
  for (const [, key] of html.matchAll(/data-i18n(?:-placeholder|-title|-aria-label)?="([^"]+)"/g)) {
    assert.ok(en[key] || literals.has(key), `Unknown translation: ${key}`);
  }
});

test('system labels switch languages while user values remain intact', () => {
  assert.equal(localizeSystemText('Production handoff', 'cn'), '生产交接');
  assert.equal(localizeSystemText('Customer design ABC', 'cn'), 'Customer design ABC');
  assert.equal(localizeQuoteText('Letter M #2 - Custom material, front-lit', 'cn'), '字形 M #2 - Custom material, 正发光');
  assert.equal(localizeSystemText('QT-1 · Revision 3', 'cn'), 'QT-1 · 第 3 版');
  assert.equal(localizeCatalogLabel('budget Aluminium(无边edgeless)-50MM边', 'en'), 'Budget aluminium (edgeless) · 50mm side');
  assert.equal(localizeCatalogLabel('Mild Steel 0.9mm', 'cn'), '低碳钢 0.9mm');
  assert.equal(localizeCatalogLabel('Custom material 123', 'cn'), 'Custom material 123');
});

test('workbench labels, saved messages and dynamic counts support both directions', () => {
  for (const [en, cn] of translations) {
    assert.equal(translate(en, 'cn'), cn, en);
    if (translations.filter(pair => pair[1] === cn).length === 1) assert.equal(translate(cn, 'en'), en, cn);
  }
  assert.equal(translate('Imported 3 parts · 7 existing holes preserved.', 'cn'), '已导入 3 个部件 · 已保留 7 个现有洞位。');
  assert.equal(translate('Hole 2: too close to a wall or another hole.', 'cn'), '洞 2：距离墙体或其他洞太近。');
});
