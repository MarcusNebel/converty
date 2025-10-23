/**
 * Erweiterte Sprachdetektion:
 * 1. Liest gespeicherte Sprache aus dem Electron-Store (IPC)
 * 2. Falls keine gesetzt → Systemsprache (app.getLocale() oder navigator.language)
 * 3. Prüft, ob Sprache unterstützt wird
 * 4. Speichert neue Sprache im Store
 * 5. Fällt bei Fehler oder unbekannter Sprache auf "en" zurück
 */
export async function detectLanguage(supportedLangs: string[] = ["en", "de"]): Promise<string> {
  try {
    // Wenn Electron-Bridge verfügbar ist
    if (window.electron?.app?.getLocale && window.electron?.store) {
      // 1️⃣ Gespeicherte Sprache aus Store lesen
      const savedLang = await window.electron.store.get("locale");
      if (savedLang && supportedLangs.includes(savedLang)) {
        return savedLang;
      }

      // 2️⃣ Systemsprache ermitteln
      const locale = await window.electron.app.getLocale();
      const short = locale.split("-")[0].toLowerCase();
      const detectedLang = supportedLangs.includes(short) ? short : "en";

      // 3️⃣ Neue Sprache im Store speichern
      await window.electron.store.set("locale", detectedLang);
      return detectedLang;
    }

    // Fallback: Browser-Sprache (z. B. im Dev-Modus)
    const browserLang = navigator.language.split("-")[0].toLowerCase();
    return supportedLangs.includes(browserLang) ? browserLang : "en";
  } catch (err) {
    console.error("Fehler bei der Spracherkennung:", err);
    return "en";
  }
}
