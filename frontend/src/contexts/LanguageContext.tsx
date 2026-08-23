import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ar from '../locales/ar';
import fr from '../locales/fr';
import { storage } from '../utils/helpers';

type Translations = Omit<typeof ar, 'dir'> & { dir: 'rtl' | 'ltr' };

interface LanguageContextType {
  lang: string;
  dir: 'rtl' | 'ltr';
  t: Translations;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  dir: 'rtl',
  t: ar as Translations,
  setLanguage: () => {},
});

const translations: Record<string, Translations> = { ar: ar as Translations, fr: fr as Translations };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(() => storage.getLang());

  const t = translations[lang] || ar;
  const dir = t.dir;

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body.style.fontFamily =
      dir === 'rtl' ? "'Tajawal', sans-serif" : "'Inter', sans-serif";
  }, [dir, lang]);

  const setLanguage = (newLang: string) => {
    setLang(newLang);
    storage.setLang(newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
