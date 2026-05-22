import { createContext, useContext, useState, useEffect } from "react";

export type Language = "he" | "ru";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "he",
  setLang: () => {},
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("newborn-tracker-lang");
    return (stored === "ru" ? "ru" : "he") as Language;
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("newborn-tracker-lang", l);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir: lang === "he" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
