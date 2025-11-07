import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import de from "./locales/de/translation.json";
import fr from "./locales/fr/translation.json"
import { detectLanguage } from "./detector";

(async () => {
  const detectedLang = await detectLanguage(["en", "de", "fr"]);

  await i18n
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, de: { translation: de }, fr: { translation: fr } },
      lng: detectedLang,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
})();

export default i18n;
