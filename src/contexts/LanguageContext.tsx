import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t as translate, tReplace, getDateLocale, getCurrencyLocale } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  tr: (key: TranslationKey, replacements: Record<string, string | number>) => string;
  dateLocale: string;
  currencyLocale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem("costcontrl-lang");
    if (stored === "en" || stored === "pl") return stored;
  } catch {}
  return "pl";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("costcontrl-lang", l); } catch {}
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "pl" ? "en" : "pl");
  }, [locale, setLocale]);

  const t = useCallback((key: TranslationKey) => translate(key, locale), [locale]);
  const tr = useCallback(
    (key: TranslationKey, replacements: Record<string, string | number>) =>
      tReplace(key, locale, replacements),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      tr,
      dateLocale: getDateLocale(locale),
      currencyLocale: getCurrencyLocale(locale),
    }),
    [locale, setLocale, toggleLocale, t, tr],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
