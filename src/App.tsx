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

function AppContent() {
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [themePref, setThemePref] = useState<string>("system");

  // Setup-Status prüfen
  useEffect(() => {
    checkSetup().then(setIsSetupDone);
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const setupData = await window.electron.setup.getSetupData();

        // Sprache
        if (setupData?.language) await i18n.changeLanguage(setupData.language);

        // Theme preference speichern (system | light | dark)
        const saved = setupData?.theme || "system";
        setThemePref(saved);

        // initial anwenden (wenn system -> wähle aktuell passendes)
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
  }, [i18n]);

  // reagiere live auf System-Theme-Änderungen — aber nur falls themePref === "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (themePref !== "system") return;
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    };

    // kompatibler Listener: addEventListener (modern) -> fallback auf addListener
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
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/convert-media" element={<Media />} />
          <Route path="/convert-image" element={<Image />} />
          <Route path="/convert-archive" element={<Archive />} />
          <Route path="/convert-document" element={<Document />} />
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
