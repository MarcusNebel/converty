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
import Help from "./pages/Help";
import Sidebar from "./components/Sidebar";
import { checkSetup } from "./utils/setup/setupStatus";
import type { NotificationItem } from "./components/Sidebar";

function AppContent() {
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [themePref, setThemePref] = useState<string>("system");
  const [isConverting, setIsConverting] = useState(false);

  const addNotification = (note: NotificationItem) => {
    if (window.notificationFn) {
      window.notificationFn(note);
    }
  };

  /* Load custom css */
  useEffect(() => {
    (async () => {
      const css = await window.electron.store.get("customCSS");
      if (!css) return;

      let tag = document.getElementById("custom-css-style") as HTMLStyleElement;
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "custom-css-style";
        document.head.appendChild(tag);
      }

      tag.textContent = css;
    })();
  }, []);

  // Setup-Status prüfen
  useEffect(() => {
    checkSetup().then(setIsSetupDone);
  }, []);

  // Lade Theme und Sprache sicher
  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      try {
        // Setze Timeout Fallback, falls IPC nicht reagiert
        const timeout = new Promise(resolve => setTimeout(() => resolve(null), 3000));
        const setupData = (await Promise.race([window.electron.setup.getSetupData(), timeout])) || {};

        if (cancelled) return;

        // Sprache
        if (setupData.language) await i18n.changeLanguage(setupData.language).catch(() => {});

        // Theme preference speichern
        const saved = setupData.theme || "system";
        setThemePref(saved);

        // Theme anwenden
        if (saved === "system") {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        } else {
          document.documentElement.setAttribute("data-theme", saved);
        }
      } catch (err) {
        console.warn("Fehler beim Laden der Einstellungen:", err);
      }
    };

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [i18n]);

  useEffect(() => {
    const checkUpdateAndNotify = async () => {
      try {
        const result = await window.electron.update.check();
        if (result.error) return;

        if (result.downloadUrl) {
          const updateNotification: NotificationItem = {
            key: "notifications.update",
            params: {
              version: result.remoteVersion,
              url: result.downloadUrl,
            },
          };

          console.log("UPDATE CHECK RESULT:", result);

          // Panel-Benachrichtigung
          if (window.notificationFn) addNotification?.(updateNotification);

          // Desktop-Benachrichtigung
          const body = `${t("notifications.update")} ${result.remoteVersion}`;
          window.electron.ipcRenderer.send("show-notification", {
            title: "Converty Update",
            body,
          });

          // In den Store schreiben, nur wenn Version noch nicht existiert
          const oldNotifications: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
          const alreadyExists = oldNotifications.some(
            (n) => n.key === "notifications.update" && n.params?.version === result.remoteVersion
          );

          if (!alreadyExists) {
            const newNotifications = [updateNotification, ...oldNotifications];
            await window.electron.store.set("notifications", newNotifications);

            // Sound abspielen
            const updateSound = new Audio("sounds/new-notification.wav");
            updateSound.play().catch(e => console.log("Sound konnte nicht abgespielt werden:", e));
          }
        }
      } catch (err: any) {
        console.error("Update-Check fehlgeschlagen:", err.message);

        // Fehler als Notification
        const errorNotification: NotificationItem = {
          key: "notifications.update-error",
          params: { message: err.message },
        };

        if (window.notificationFn) addNotification?.(errorNotification);
        const body = `Update-Check fehlgeschlagen: ${err.message}`;
        window.electron.ipcRenderer.send("show-notification", { title: "Converty Update", body });

        const oldNotifications: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
        const newNotifications = [errorNotification, ...oldNotifications];
        await window.electron.store.set("notifications", newNotifications);

        const errorSound = new Audio("sounds/new-notification-error.wav");
        errorSound.play().catch(e => console.log("Sound konnte nicht abgespielt werden:", e));
      }
    };

    checkUpdateAndNotify();
  }, []);

  // reagiere live auf System-Theme-Änderungen
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themePref !== "system") return;
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange as EventListener);
    } else {
      // older APIs
      // @ts-ignore
      mq.addListener(handleChange);
    }

    return () => {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", handleChange as EventListener);
      } else {
        // @ts-ignore
        mq.removeListener(handleChange);
      }
    };
  }, [themePref]);

  // Debug-Listener
  useEffect(() => {
    window.electron.on("debug-log", (_, msg: string) => {
      console.log("Debug vom Main:", msg);
    });
  }, []);

  if (isSetupDone === null) return <div>Lädt...</div>;
  if (!isSetupDone) return <SetupWizard onSetupComplete={() => setIsSetupDone(true)} />;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        active={location.pathname.replace("/", "") || "dashboard"}
        onSelect={(page) => {
          if (page === "dashboard") navigate("/");
          else navigate("/" + page);
        }}
        isConverting={isConverting}
        addNotification={addNotification}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/convert-media" element={
            <Media 
              isConverting={isConverting} 
              setIsConverting={setIsConverting} 
              addNotification={addNotification}
            />} 
          />
          <Route path="/convert-image" element={
            <Image 
              isConverting={isConverting} 
              setIsConverting={setIsConverting} 
              addNotification={addNotification}
            />} 
          />
          <Route path="/convert-archive" element={
            <Archive 
              isConverting={isConverting} 
              setIsConverting={setIsConverting} 
              addNotification={addNotification}
            />} 
          />
          <Route path="/convert-document" element={
            <Document 
              isConverting={isConverting} 
              setIsConverting={setIsConverting} 
              addNotification={addNotification}
            />} 
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
