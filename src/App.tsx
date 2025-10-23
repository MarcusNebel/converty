import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SetupWizard from "./pages/setup/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/converts/Archive";
import Media from "./pages/converts/Media";
import Image from "./pages/converts/Image";
import Document from "./pages/converts/Document";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { checkSetup } from "./utils/setup/setupStatus";

function AppContent() {
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSetup().then(setIsSetupDone);
  }, []);

  useEffect(() => {
    window.electron.theme.get().then((savedTheme: string) => {
      if (savedTheme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
    });
  }, []);

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
