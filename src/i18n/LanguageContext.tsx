import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'cs' | 'en';

export const LANGUAGE_STORAGE_KEY = 'logic_games_lang_v1';

export function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'cs';

  try {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang')?.toLowerCase();
    if (paramLang === 'en' || paramLang === 'cs') {
      return paramLang;
    }
  } catch {
    // ignore invalid URL search params
  }

  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'cs') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }

  return 'cs';
}

interface LanguageContextValue {
  lang: Language;
  isEn: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  pick: <T>(cs: T, en: T) => T;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'cs',
  isEn: false,
  setLang: () => {},
  toggleLang: () => {},
  pick: <T,>(cs: T) => cs,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.title =
        lang === 'en'
          ? 'Logic Games 6-in-1 — Sudoku, Tango, Queens, Minibridge, Mahjong & Zip'
          : 'Logické Hry 6v1 — Sudoku, Tango, Queens, Minibridge, Mahjong a Zip';
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'cs' ? 'en' : 'cs'));
  }, []);

  const pick = useCallback(
    <T,>(cs: T, en: T): T => (lang === 'en' ? en : cs),
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      isEn: lang === 'en',
      setLang,
      toggleLang,
      pick,
    }),
    [lang, setLang, toggleLang, pick]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
