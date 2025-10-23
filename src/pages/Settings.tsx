import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";

export default function Home() {
  const [theme, setTheme] = useState<string>("system");
  const { t } = useTranslation();

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

  const handleThemeChange = async (newTheme: string) => {
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
    <div className="home-page">
      <div className="theme-grid">
        <label htmlFor="theme">{t("home.theme.label")}</label>
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
      </div>

      <button onClick={handleShowData}>Setup-Daten anzeigen</button>
      <button onClick={handleReset}>Setup zurücksetzen</button>
    </div>
  );
}
