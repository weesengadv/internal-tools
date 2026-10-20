export function readPreferences(storage, systemDark = false) {
  let theme, language;
  try { theme = storage.getItem('weesengTheme'); language = storage.getItem('gcodeEditorLanguage'); } catch {}
  return { theme: ['light', 'dark'].includes(theme) ? theme : systemDark ? 'dark' : 'light', language: language === 'cn' ? 'cn' : 'en' };
}

export function validPreferences(value) {
  return !!value && ['light', 'dark'].includes(value.theme) && ['en', 'cn'].includes(value.language);
}

export function initAppearance({ onChange = () => {} } = {}) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let storage;
  try { storage = window.localStorage; } catch {}
  let preferences = readPreferences(storage, media.matches);
  const toggle = document.getElementById('themeToggle');
  let explicitTheme = false;
  try { explicitTheme = ['light', 'dark'].includes(storage?.getItem('weesengTheme')); } catch {}
  function apply() {
    document.documentElement.dataset.theme = preferences.theme;
    const dark = preferences.theme === 'dark', cn = preferences.language === 'cn';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', cn ? (dark ? '切换日间模式' : '切换夜间模式') : (dark ? 'Switch to day mode' : 'Switch to night mode'));
    toggle.title = toggle.getAttribute('aria-label');
    toggle.querySelector('[data-theme-icon]').textContent = dark ? '☀' : '☾';
    onChange({ ...preferences });
    window.dispatchEvent(new CustomEvent('weeseng-preferences', { detail: { ...preferences } }));
  }
  toggle.addEventListener('click', () => {
    preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark';
    explicitTheme = true;
    try { storage?.setItem('weesengTheme', preferences.theme); } catch {}
    apply();
  });
  media.addEventListener('change', event => {
    if (!explicitTheme) { preferences.theme = event.matches ? 'dark' : 'light'; apply(); }
  });
  window.addEventListener('storage', event => {
    if (['weesengTheme', 'gcodeEditorLanguage', null].includes(event.key)) {
      preferences = readPreferences(storage, media.matches);
      try { explicitTheme = ['light', 'dark'].includes(storage?.getItem('weesengTheme')); } catch {}
      apply();
    }
  });
  apply();
  return {
    get preferences() { return { ...preferences }; },
    setLanguage(language) { preferences.language = language === 'cn' ? 'cn' : 'en'; apply(); }
  };
}
