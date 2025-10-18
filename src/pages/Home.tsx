import { useState, useEffect } from "react";

export default function Home() {
  const [theme, setTheme] = useState<string>("system");

  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = (await window.electron.theme.get()) as string;
      setTheme(savedTheme);
      applyTheme(savedTheme);
    };
    loadTheme();
  }, []);

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    applyTheme(newTheme);
    const setupData = await window.electron.setup.getSetupData();
    setupData.theme = newTheme;
    await window.electron.setup.saveSetupData(setupData);
  };

  const handleShowData = async () => {
    const data = await window.electron.setup.invoke("setup:getData");
    if (data) alert("Gespeicherte Setup-Daten:\n" + JSON.stringify(data, null, 2));
    else alert("Keine Setup-Daten gespeichert.");
  };

  const handleReset = async () => {
    await window.electron.setup.invoke("setup:reset");
    alert("Setup zurückgesetzt! Starte die App neu, um erneut zu konfigurieren.");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="theme-grid">
        <label htmlFor="theme" className="theme-label">
          App-Theme:
        </label>
        <select
          id="theme"
          value={theme}
          onChange={handleThemeChange}
          className="theme-select"
        >
          <option value="system">System</option>
          <option value="light">Hell</option>
          <option value="dark">Dunkel</option>
        </select>
      </div>

      <button onClick={handleShowData}>Setup-Daten anzeigen</button>
      <button onClick={handleReset}>Setup zurücksetzen</button>
    </div>
  );
}
