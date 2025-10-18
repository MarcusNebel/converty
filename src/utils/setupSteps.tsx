import type { SetupStep, SetupStepComponentProps } from "./types";

export const setupSteps: SetupStep[] = [
  {
    id: 1,
    title: "Willkommen",
    description: "Starte das Setup mit einem Klick auf „Weiter“.",
    component: () => <p className="wellcome-component">Willkommen bei Converty! Dieses Setup hilft dir, das Programm optimal einzurichten.</p>,
  },
  {
    id: 2,
    title: "Persönliche Daten",
    description: "Gib hier deinen Namen ein (optional).",
    component: ({ setupData, updateSetupData }: SetupStepComponentProps) => {
      return (
        <div className="setup-personal-data-step">
          <input
            id="name"
            type="text"
            value={setupData.name}
            onChange={(e) => updateSetupData("name", e.target.value)}
            className="setup-text-input"
            placeholder="Dein Name"
          />
          <p className="step-right-subtitle">Dein Name dient nur zur Personalisierung des Programms!</p>
        </div>
      );
    },
  },
  {
    id: 3,
    title: "App-Einstellungen",
    description: "Lege Standardordner, Formate und Theme fest.",
    component: ({ setupData, updateSetupData, applyTheme }: SetupStepComponentProps) => {
      const selectFolder = async () => {
        try {
          const path = await window.electron.setup.selectFolder();
          if (path) updateSetupData("folder", path);
        } catch (err) {
          console.error("Ordnerauswahl fehlgeschlagen:", err);
        }
      };

      return (
        <div className="setup-app-settings-step">
          <div className="standard-formats-grid">
            <label className="standard-formats-label">Standard-Formate:</label>
            {/* Video */}
            <div>
              <label htmlFor="videoFormat" className="format-title">
                Videos:
              </label>
              <select
                id="videoFormat"
                value={setupData.videoFormat}
                onChange={(e) => updateSetupData("videoFormat", e.target.value)}
                className="format-select"
              >
                <option className="test" value="mp4">MP4</option>
                <option value="avi">AVI</option>
                <option value="mov">MOV</option>
                <option value="mkv">MKV</option>
              </select>
            </div>

            {/* Bilder */}
            <div>
              <label htmlFor="imageFormat" className="format-title">
                Bilder:
              </label>
              <select
                id="imageFormat"
                value={setupData.imageFormat}
                onChange={(e) => updateSetupData("imageFormat", e.target.value)}
                className="format-select"
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
                <option value="bmp">BMP</option>
              </select>
            </div>

            {/* Archive */}
            <div>
              <label htmlFor="archiveFormat" className="format-title">
                Archive:
              </label>
              <select
                id="archiveFormat"
                value={setupData.archiveFormat}
                onChange={(e) => updateSetupData("archiveFormat", e.target.value)}
                className="format-select"
              >
                <option value="zip">ZIP</option>
                <option value="rar">RAR</option>
                <option value="7z">7Z</option>
                <option value="tar">TAR</option>
              </select>
            </div>

            {/* Dokumente */}
            <div>
              <label htmlFor="documentFormat" className="format-title">
                Dokumente:
              </label>
              <select
                id="documentFormat"
                value={setupData.documentFormat}
                onChange={(e) => updateSetupData("documentFormat", e.target.value)}
                className="format-select"
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
                <option value="odt">ODT</option>
              </select>
            </div>
          </div>

          {/* Theme */}
          <div className="theme-grid">
            <label htmlFor="theme" className="theme-label">
              App-Theme:
            </label>
            <select
              id="theme"
              value={setupData.theme}
              onChange={(e) => {
                const selectedTheme = e.target.value;
                updateSetupData("theme", selectedTheme);
                applyTheme?.(selectedTheme);
                window.electron.theme.set(selectedTheme);
              }}
              className="theme-select"
            >
              <option value="system">System</option>
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
            </select>
          </div>

          {/* Ordner */}
          <div className="folder-grid">
            <label htmlFor="folder" className="folder-label">
              Standardordner:
            </label>
            <div className="folder-input-with-button">
              <input
                id="folder"
                type="text"
                value={setupData.folder}
                onChange={(e) => updateSetupData("folder", e.target.value)}
                className="folder-select-input"
                placeholder="Zielordner wählen"
              />
              <button
                onClick={selectFolder}
                className="folder-select-button"
              >
                Durchsuchen
              </button>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: 4,
    title: "Benachrichtigungen",
    description: "Aktiviere oder deaktiviere Push-Benachrichtigungen.",
    component: ({ setupData, updateSetupData }: SetupStepComponentProps) => {
      return (
        <div className="flex flex-col items-center space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={setupData.pushNotifications}
              onChange={() => updateSetupData("pushNotifications", !setupData.pushNotifications)}
              className="push-notification-checkbox"
            />
            <span className="step-right-push-notification">Push-Benachrichtigungen aktivieren</span>
          </label>
        </div>
      );
    },
  },
  {
    id: 5,
    title: "Fertig",
    description: "Überprüfe deine Einstellungen und starte die App.",
    component: ({ setupData }: { setupData: any }) => (
      <div className="setup-final-step-container">
        <div className="setup-final-step-card">
          <span className="setup-final-step-label">Name / Benutzername:</span>
          <span className="setup-final-step-value">{setupData.name || "Nicht angegeben"}</span>
        </div>

        <div className="setup-final-step-card">
          <span className="setup-final-step-label">Standardordner:</span>
          <span className="setup-final-step-value">{setupData.folder || "Nicht angegeben"}</span>
        </div>

        <div className="setup-final-step-card">
          <span className="setup-final-step-label">Theme:</span>
          <span className="setup-final-step-value">{setupData.theme}</span>
        </div>

        <div className="setup-final-step-card">
          <span className="setup-final-step-label">Standard-Formate:</span>
          <ul className="setup-final-step-list-formats">
            <li>Videos: {setupData.videoFormat}</li>
            <li>Bilder: {setupData.imageFormat}</li>
            <li>Archive: {setupData.archiveFormat}</li>
            <li>Dokumente: {setupData.documentFormat}</li>
          </ul>
        </div>

        <div className="setup-final-step-card">
          <span className="setup-final-step-label">Push-Benachrichtigungen:</span>
          <span className="setup-final-step-value">
            {setupData.pushNotifications ? "Aktiviert" : "Deaktiviert"}
          </span>
        </div>
      </div>
    ),
  }
];
