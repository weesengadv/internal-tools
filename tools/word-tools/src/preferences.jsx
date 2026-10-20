import React, { createContext, useContext, useEffect, useState } from 'react';
import { translate } from './i18n.mjs';

const Context = createContext({ language: 'en', theme: 'light' });
export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => ({ language: 'en', theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }));
  useEffect(() => {
    let parentOrigin;
    try { parentOrigin = new URL(document.referrer).origin; } catch { return; }
    const receive = event => {
      const data = event.data;
      if (event.source !== window.parent || event.origin !== parentOrigin || data?.type !== 'weeseng-preferences' || !['en', 'cn'].includes(data.language) || !['light', 'dark'].includes(data.theme)) return;
      setPreferences({ language: data.language, theme: data.theme });
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({ type: 'weeseng-preferences-ready' }, parentOrigin);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.language === 'cn' ? 'zh-CN' : 'en';
    document.title = translate('3D word tools', preferences.language);
  }, [preferences]);
  return <Context.Provider value={preferences}>{children}</Context.Provider>;
}
export function usePreferences() {
  const preferences = useContext(Context);
  return { ...preferences, t: value => translate(value, preferences.language) };
}
