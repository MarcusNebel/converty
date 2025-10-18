import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import SetupWizard from "./pages/SetupWizard";
import Home from "./pages/Home";
import { useEffect, useState } from "react";
import { checkSetup } from "./utils/setupStatus";

export default function App() {
  const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);

  useEffect(() => {
    checkSetup().then(setIsSetupDone);
  }, []);

  function applyTheme(theme: string) {
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  useEffect(() => {
    window.electron.theme.get().then((savedTheme: string) => applyTheme(savedTheme));
  }, []);

  if (isSetupDone === null) return <div>Lädt...</div>;

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/setup"
          element={<SetupWizard onSetupComplete={() => setIsSetupDone(true)} />}
        />
        <Route
          path="/"
          element={isSetupDone ? <Home /> : <Navigate to="/setup" />}
        />
      </Routes>
    </HashRouter>
  );
}
