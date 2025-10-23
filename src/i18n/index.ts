import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import de from "./locales/de/translation.json";
import { detectLanguage } from "./detector";

(async () => {
  const detectedLang = await detectLanguage(["en", "de"]);

  await i18n
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, de: { translation: de } },
      lng: detectedLang, // ← jetzt ist es ein String
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
})();

export default i18n;
