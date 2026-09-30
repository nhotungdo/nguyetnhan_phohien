import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vi } from "../locales/vi";
import { en } from "../locales/en";

type Language = "vi" | "en";
type Translations = typeof vi;

interface LanguageState {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

interface PersistedLanguageState {
  language?: Language;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "vi",
      t: vi,
      setLanguage: (lang: Language) =>
        set({
          language: lang,
          t: lang === "vi" ? vi : en,
        }),
    }),
    {
      name: "language-storage",
      merge: (persistedState: unknown, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedLanguageState;
        const language = persisted.language ?? currentState.language;
        return {
          ...currentState,
          language,
          t: language === "en" ? en : vi,
        };
      },
    }
  )
);
