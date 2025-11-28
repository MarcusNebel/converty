import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SetupWizard from "./pages/setup/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/converts/Archive";
import Media from "./pages/converts/Media";
import Image from "./pages/converts/Image";
import Document from "./pages/converts/Document";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { checkSetup } from "./utils/setup/setupStatus";
import type { NotificationItem } from "./components/Sidebar";
import semver from "semver";
import { SettingsContext } from "./utils/context/SettingsContext";

function AppContent() {
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [themePref, setThemePref] = useState<string>("system");
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const addNotification = (note: NotificationItem) => {
    if (window.notificationFn) window.notificationFn(note);
  };

  const loadCssTheme = async (css: string, name?: string) => {
    setThemePref("custom"); // Custom CSS hat Vorrang
    let tag = document.getElementById("custom-css-style") as HTMLStyleElement;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "custom-css-style";
      document.head.appendChild(tag);
    }
    tag.textContent = css;
    if (name) await window.electron.store.set("activeCustomCSSTheme", name);
  };

  // Initiales Setup, Theme & Sprache laden
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const setupStatus = await checkSetup();
        if (cancelled) return;
        setIsSetupDone(setupStatus);

        const timeout = new Promise(resolve => setTimeout(() => resolve(null), 3000));
        const setupData = (await Promise.race([window.electron.setup.getSetupData(), timeout])) || {};

        if (cancelled) return;

        // Sprache setzen
        if (setupData.language) await i18n.changeLanguage(setupData.language).catch(() => {});

        // Zuerst Standard-Theme setzen (System oder gespeichertes)
        let savedTheme = setupData.theme || "system";
        if (savedTheme === "system") {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        } else {
          document.documentElement.setAttribute("data-theme", savedTheme);
        }
        setThemePref(savedTheme);

        // Danach Custom CSS laden, falls vorhanden
        const activeThemeName = await window.electron.store.get("activeCustomCSSTheme");
        if (activeThemeName) {
          const css = await window.electron.store.get(`customCSS:${activeThemeName}`);
          if (css) {
            await loadCssTheme(css, activeThemeName); // überschreibt Standard-Theme
          }
        }

      } catch (err) {
        console.warn("Fehler beim Laden der App-Einstellungen:", err);
      } finally {
        setIsAppReady(true); // erst rendern, wenn Theme & Custom CSS gesetzt
      }
    })();

    return () => { cancelled = true; };
  }, [i18n]);

  // Reagiere auf System-Theme-Änderungen
  useEffect(() => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themePref !== "system") return; // Custom CSS oder festes Theme ignorieren
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", handleChange as EventListener);
    else mq.addListener(handleChange as any);
    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", handleChange as EventListener);
      else mq.removeListener(handleChange as any);
    };
  }, [themePref]);

  // Update-Check
  useEffect(() => {
    (async () => {
      try {
        const result = await window.electron.update.check();
        if (result.error) return;

        const localVersion = await window.electron.app.getVersion();
        const remoteVersion = result.remoteVersion;
        if (!semver.gt(remoteVersion, localVersion)) return;

        const updateNotification: NotificationItem = {
          key: "notifications.update",
          params: { version: remoteVersion, url: result.downloadUrl || "" },
        };

        if (window.notificationFn) window.notificationFn(updateNotification);
        window.electron.ipcRenderer.send("show-notification", {
          title: "Converty Update",
          body: `${t("notifications.update")} ${remoteVersion}`,
        });

        const oldNotifications: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
        if (!oldNotifications.some(n => n.key === "notifications.update" && n.params?.version === remoteVersion)) {
          await window.electron.store.set("notifications", [updateNotification, ...oldNotifications]);
          new Audio("sounds/new-notification.wav").play().catch(() => {});
        }
      } catch (err) {
        console.error("Update-Check fehlgeschlagen:", err);
      }
    })();
  }, []);

  // Debug-Listener
  useEffect(() => {
    window.electron.on("debug-log", (_, msg: string) => console.log("Debug vom Main:", msg));
  }, []);

  if (!isAppReady) return <div>Lädt...</div>;
  if (!isSetupDone) return <SetupWizard onSetupComplete={() => setIsSetupDone(true)} />;

  return (
    <SettingsContext.Provider value={{ activeTab, setActiveTab }}>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar
        active={location.pathname.replace("/", "") || "dashboard"}
        onSelect={(page) => navigate(page === "dashboard" ? "/" : "/" + page)}
        isConverting={isConverting}
        addNotification={addNotification}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/convert-media" element={<Media isConverting={isConverting} setIsConverting={setIsConverting} addNotification={addNotification} />} />
          <Route path="/convert-image" element={<Image isConverting={isConverting} setIsConverting={setIsConverting} addNotification={addNotification} />} />
          <Route path="/convert-archive" element={<Archive isConverting={isConverting} setIsConverting={setIsConverting} addNotification={addNotification} />} />
          <Route path="/convert-document" element={<Document isConverting={isConverting} setIsConverting={setIsConverting} addNotification={addNotification} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
    </SettingsContext.Provider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
