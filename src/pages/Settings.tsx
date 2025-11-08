import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";
import "../styles/Settings.css";
import ConfirmModal from "../utils/confirmModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaCheck } from "react-icons/fa";

export default function Home() {
  const [theme, setTheme] = useState<string>("system");
  const [activeTab, setActiveTab] = useState<string>("general");
  const [modalVisible, setModalVisible] = useState(false);
  const [language, setLanguage] = useState<string>("en");
  const { t, i18n } = useTranslation();

  const [checking, setChecking] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloadedText, setDownloadedText] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    interface DownloadProgress {
      downloaded: number;
      total: number;
    }

    const listener = (_event: any, { downloaded, total }: DownloadProgress) => {
      const percent = Math.round((downloaded / total) * 100);
      setProgress(percent);
      setDownloadedText(`${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`);
    };

    window.electron.ipcRenderer.on("update:download-progress", listener);

    return () => {
      // removeListener in global.d.ts korrekt typisieren
      if (window.electron.ipcRenderer.removeListener) {
        window.electron.ipcRenderer.removeListener("update:download-progress", listener);
      } else {
        window.electron.ipcRenderer.removeAllListeners("update:download-progress");
      }
    };
  }, []);

  
  const startDownload = async () => {
    const url = updateData?.downloadUrl;
    if (!url) return;
    setIsDownloading(true);
    setDownloadComplete(false);

    await window.electron.ipcRenderer.invoke("update:download", url);

    setIsDownloading(false);
    setDownloadComplete(true); // Download abgeschlossen
  };

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await window.electron.update.check();
      if (result.error) setError(result.error);
      setUpdateData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Beim Laden direkt aktuelle Version anzeigen
    checkForUpdates();
  }, []);

  const confirmReset = async () => {
    setModalVisible(false);
    await handleReset();
  };

  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
  };

  useEffect(() => {
    const loadThemeAndLanguage = async () => {
      const setupData = await window.electron.setup.getSetupData();
      const savedTheme = setupData?.theme || "system";
      const savedLanguage = setupData?.language || i18n.language || "en";

      setTheme(savedTheme);
      setLanguage(savedLanguage);
      applyTheme(savedTheme);
      i18n.changeLanguage(savedLanguage);
    };
    loadThemeAndLanguage();
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);

    const setupData = await window.electron.setup.getSetupData();
    setupData.theme = newTheme;
    await window.electron.setup.saveSetupData(setupData);
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);

    const setupData = await window.electron.setup.getSetupData();
    setupData.language = newLang;
    await window.electron.setup.saveSetupData(setupData);
  };

  const handleShowData = async () => {
    const data = await window.electron.setup.invoke("setup:getData");
    if (data) alert("Gespeicherte Setup-Daten:\n" + JSON.stringify(data, null, 2));
    else alert("Keine Setup-Daten gespeichert.");
  };

  const handleShowElectronStoreData = async () => {
    const data = await window.electron.setup.invoke("setup:getElectronStoreData");
    if (data) alert("Gespeicherte Electron-Store-Daten:\n" + JSON.stringify(data, null, 2));
    else alert("Keine Electron-Store-Daten gespeichert.");
  };

  const handleReset = async () => {
    await window.electron.setup.invoke("setup:reset");
    alert("Setup zurückgesetzt! Starte die App neu, um erneut zu konfigurieren.");
  };

  const sendNotification = async () => {
    const notificationTitle = "Test Notification";
    const notificationBody = "This is a test notification from the renderer of the Electron app Converty.";

    new window.Notification(notificationTitle, { body: notificationBody });
  };

  return (
    <div className="settings-page">
      <div className="top-navbar">
        <span
          className={`navbar-option ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          {t("settings.general")}
        </span>
        <span
          className={`navbar-option ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          {t("settings.notifications")}
        </span>
        <span
          className={`navbar-option ${activeTab === "output" ? "active" : ""}`}
          onClick={() => setActiveTab("output")}
        >
          {t("settings.output")}
        </span>
        <span
          className={`navbar-option ${activeTab === "update" ? "active" : ""}`}
          onClick={() => setActiveTab("update")}
        >
          {t("settings.update")}
        </span>
      </div>

      <div className="settings-content">
        {activeTab === "general" && (
          <div className="settings-general-grid">
            <h2 className="h2-settings">{t("settings.general-settings.theme")}</h2>
            <CustomSelect
              options={[
                { value: "system", label: t("home.theme.system") },
                { value: "light", label: t("home.theme.light") },
                { value: "dark", label: t("home.theme.dark") },
              ]}
              value={theme}
              onChange={handleThemeChange}
              placeholder={t("setup.steps.theme_label")}
            />

            <div className="language-settings">
              <h2 className="h2-settings">{t("settings.general-settings.language-settings.title")}</h2>
              <CustomSelect
                options={[
                  { value: "en", label: t("setup.steps.language_english") },
                  { value: "de", label: t("setup.steps.language_german") },
                  { value: "fr", label: t("setup.steps.language_french") },
                ]}
                value={language}
                onChange={handleLanguageChange}
                placeholder={t("setup.steps.language_label")}
              />
            </div>

            <div className="settings-debugging">
              <h2 className="h2-settings">{t("settings.general-settings.debugging")}</h2>
              <button className="btn-settings" onClick={handleShowElectronStoreData}>
                Electron-Store-Daten anzeigen
              </button>
              <button className="btn-settings" onClick={handleShowData}>
                Setup-Daten anzeigen
              </button>
              <button className="btn-warning" onClick={() => setModalVisible(true)}>
                Setup zurücksetzen
              </button>

              <ConfirmModal
                visible={modalVisible}
                title={t("settings.general-settings.reset-setup-modal.title")}
                description={t("settings.general-settings.reset-setup-modal.description")}
                confirmText={t("settings.general-settings.reset-setup-modal.confirm-text")}
                cancelText={t("settings.general-settings.reset-setup-modal.cancel-text")}
                onConfirm={confirmReset}
                onCancel={() => setModalVisible(false)}
              />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="settings-notifications">
            <h2 className="h2-settings">{t("settings.notification-settings.notifications")}</h2>
            <button className="btn-settings" onClick={sendNotification}>
              Test Notification
            </button>
          </div>
        )}

        {activeTab === "output" && (
          <div className="settings-output">
            <h2 className="h2-settings">{t("settings.output-settings.output")}</h2>
            <p>Hier kannst du später den Output-Pfad einstellen…</p>
          </div>
        )}

        {activeTab === "update" && (
          <div className="settings-update">
            <h2 className="h2-settings">{t("settings.update-settings.update")}</h2>

            <div className="update-card">
              {checking && <p>Prüfe auf Updates...</p>}
              {error && <p className="error-text">{error}</p>}

              {updateData && (
                <>
                  {updateData.updateAvailable ? (
                    <>
                      {/* Versionsinfos */}
                      <div className="version-info">
                        <div>
                          <span>Neueste Version: {updateData.remoteVersion}</span>
                        </div>
                      </div>

                      {/* Release-Titel */}
                      <h3>{updateData.title}</h3>

                      {/* Release Notes */}
                      <div className="release-notes">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {updateData.notes}
                        </ReactMarkdown>
                      </div>

                      <div className="update-check-download-btns">
                        {/* Update Button */}
                        <button
                          className="btn-settings"
                          onClick={startDownload}
                          disabled={isDownloading || !updateData?.downloadUrl}
                        >
                          {isDownloading ? "Herunterladen..." : "Update herunterladen"}
                        </button>

                        {/* Prüfen-Button */}
                        <button
                          className="btn-settings"
                          onClick={checkForUpdates}
                          disabled={checking}
                        >
                          {checking ? "Wird geprüft..." : "Erneut prüfen"}
                        </button>
                      </div>

                      {isDownloading || downloadComplete ? (
                        <div style={{ marginTop: "12px" }}>
                          <div
                            style={{
                              background: "var(--color-bg-alt)",
                              borderRadius: "8px",
                              height: "16px",
                              width: "100%",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: downloadComplete ? "100%" : `${progress}%`,
                                height: "100%",
                                background: "var(--color-primary)",
                                transition: "width 0.2s ease",
                              }}
                            />
                          </div>
                          <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "var(--color-text)" }}>
                            {downloadComplete ? "Update-Datei wird geöffnet…" : downloadedText}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p>Converty ist bereits auf dem neuesten Stand. <FaCheck /></p>

                      <div className="update-check-download-btns">
                        {/* Prüfen-Button auch hier anzeigen */}
                        <button
                          className="btn-settings-no-margin"
                          onClick={checkForUpdates}
                          disabled={checking}
                        >
                          {checking ? "Wird geprüft..." : "Erneut prüfen"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
