import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, type Lang, type TranslationTree } from '@/i18n/translations';

interface LanguageCtx {
  lang:   Lang;
  t:      TranslationTree;
  toggle: () => void;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageCtx>({
  lang:    'fr',
  t:       translations.fr,
  toggle:  () => {},
  setLang: () => {},
});

const STORAGE_KEY = 'lb_stay_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] as TranslationTree, toggle, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
