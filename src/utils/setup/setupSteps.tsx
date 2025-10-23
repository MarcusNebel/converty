import type { SetupStep, SetupStepComponentProps } from "../types";
import { useTranslation } from "react-i18next";
import { useCallback, useState, useEffect } from "react";
import i18n from "../../i18n";
import CustomSelect from "../../components/CustomSelect";

export const FolderInput = ({ setupData, updateSetupData }: SetupStepComponentProps) => {
  const { t } = useTranslation();

  const selectFolder = async () => {
    try {
      const path = await window.electron.setup.selectFolder();
      if (path) updateSetupData("folder", path);
    } catch (err) {
      console.error("Ordnerauswahl fehlgeschlagen:", err);
    }
  };

  return (
    <div className="folder-grid">
      <label htmlFor="folder" className="folder-label">
        {t("setup.steps.folder_label")}
      </label>
      <div className="folder-input-with-button">
        <input
          id="folder"
          type="text"
          value={setupData.folder}
          onChange={(e) => updateSetupData("folder", e.target.value)}
          className="folder-select-input"
          placeholder={t("setup.steps.folder_placeholder")}
        />
        <button onClick={selectFolder} className="folder-select-button">
          {t("setup.buttons.browse")}
        </button>
      </div>
    </div>
  );
};

export const AppSettingsStep = ({ setupData, updateSetupData, applyTheme }: SetupStepComponentProps) => {
  const { t } = useTranslation();

  return (
    <div className="setup-app-settings-step">
      <div className="standard-formats-grid">
        <label className="standard-formats-label">
          {t("setup.steps.formats_label")}
        </label>
        {/* Video */}
        <div>
          <label htmlFor="videoFormat" className="format-title">
            {t("setup.steps.video_label")}
          </label>
          <CustomSelect
            options={[
              { value: "mp4", label: "MP4" },
              { value: "avi", label: "AVI" },
              { value: "mov", label: "MOV" },
              { value: "mkv", label: "MKV" },
            ]}
            value={setupData.videoFormat}
            onChange={(val) => updateSetupData("videoFormat", val)}
            placeholder="Videoformat"
          />
        </div>

        {/* Bilder */}
        <div>
          <label htmlFor="imageFormat" className="format-title">
            {t("setup.steps.image_label")}
          </label>
          <CustomSelect
            options={[
              { value: "jpg", label: "JPG" },
              { value: "png", label: "PNG" },
              { value: "webp", label: "WEBP" },
              { value: "bmp", label: "BMP" },
            ]}
            value={setupData.imageFormat}
            onChange={(val) => updateSetupData("imageFormat", val)}
            placeholder="Bildformat"
          />
        </div>

        {/* Archive */}
        <div>
          <label htmlFor="archiveFormat" className="format-title">
            {t("setup.steps.archive_label")}
          </label>
          <CustomSelect
            options={[
              { value: "zip", label: "ZIP" },
              { value: "rar", label: "RAR" },
              { value: "7z", label: "7Z" },
              { value: "tar", label: "TAR" },
            ]}
            value={setupData.archiveFormat}
            onChange={(val) => updateSetupData("archiveFormat", val)}
            placeholder="Archivformat"
          />
        </div>

        {/* Dokumente */}
        <div>
          <label htmlFor="documentFormat" className="format-title">
            {t("setup.steps.document_label")}
          </label>
          <CustomSelect
            options={[
              { value: "pdf", label: "PDF" },
              { value: "docx", label: "DOCX" },
              { value: "txt", label: "TXT" },
              { value: "odt", label: "ODT" },
            ]}
            value={setupData.documentFormat}
            onChange={(val) => updateSetupData("documentFormat", val)}
            placeholder="Dokumentformat"
          />
        </div>
      </div>

      {/* Theme */}
      <div className="theme-grid">
        <label htmlFor="theme" className="theme-label">
          {t("setup.steps.theme_label")}
        </label>
        <CustomSelect
            options={[
              { value: "system", label: t("home.theme.system") },
              { value: "light", label: t("home.theme.light") },
              { value: "dark", label: t("home.theme.dark") },
            ]}
            value={setupData.theme}
            onChange={(val) => {
              updateSetupData("theme", val);
              applyTheme?.(val);
              window.electron.theme.set(val);
            }}
            placeholder={t("setup.steps.theme_label")}
          />
      </div>

      {/* Language */}
      <div className="language-grid">
        <label htmlFor="language" className="language-label">
          {t("setup.steps.language_label")}
        </label>
        <CustomSelect
          options={[
            { value: "en", label: t("setup.steps.language_english") },
            { value: "de", label: t("setup.steps.language_german") },
          ]}
          value={setupData.language || i18n.language}
          onChange={(lang) => {
            updateSetupData("language", lang);
            i18n.changeLanguage(lang);
          }}
          placeholder={t("setup.steps.language_label")}
        />
      </div>

      {/* Ordner */}
      <FolderInput
        setupData={setupData}
        updateSetupData={updateSetupData}
        applyTheme={applyTheme}
        t={t}
      />
    </div>
  );
};

export const setupSteps = (): SetupStep[] => {
  const { t } = useTranslation();

  const personalDataComponent = useCallback(
    ({ setupData, updateSetupData }: SetupStepComponentProps) => (
      <div className="setup-personal-data-step">
        <input
          id="name"
          type="text"
          value={setupData.name}
          onChange={(e) => updateSetupData("name", e.target.value)}
          className="setup-text-input"
          placeholder={t("setup.steps.personal_name_placeholder")}
        />
        <p className="step-right-subtitle">{t("setup.steps.personal_name_info")}</p>
      </div>
    ),
    [t]
  );

  return [
    {
      id: 1,
      title: t("setup.steps.welcome_title"),
      description: t("setup.steps.welcome_description"),
      component: () => (
        <p className="wellcome-component">{t("setup.steps.welcome_component")}</p>
      ),
    },
    {
      id: 2,
      title: t("setup.steps.personal_data_title"),
      description: t("setup.steps.personal_data_description"),
      component: personalDataComponent,
    },
    {
      id: 3,
      title: t("setup.steps.app_settings_title"),
      description: t("setup.steps.app_settings_description"),
      component: AppSettingsStep,
    },
    {
      id: 4,
      title: t("setup.steps.notifications_title"),
      description: t("setup.steps.notifications_description"),
      component: ({ setupData, updateSetupData }: SetupStepComponentProps) => {
        return (
          <div className="flex flex-col items-center space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={setupData.pushNotifications}
                onChange={() =>
                  updateSetupData("pushNotifications", !setupData.pushNotifications)
                }
                className="push-notification-checkbox"
              />
              <span className="step-right-push-notification">
                {t("setup.steps.notifications_enable")}
              </span>
            </label>
          </div>
        );
      },
    },
    {
      id: 5,
      title: t("setup.steps.libreoffice_title"),
      description: t("setup.steps.libreoffice_description"),
      component: ({}: SetupStepComponentProps) => {
        const [status, setStatus] = useState("checking"); // checking | installed | not_installed | downloading

        useEffect(() => {
          window.electron.libreoffice.checkInstalled().then((installed: boolean) => {
            setStatus(installed ? "installed" : "not_installed");
          });
        }, []);

        const downloadAndInstall = async () => {
          setStatus("downloading");
          await window.electron.libreoffice.downloadAndInstall();
          setStatus("installed");
        };

        return (
          <div className="libreoffice-step">
            {status === "checking" && <p>{t("setup.steps.libreoffice_checking")}</p>}
            {status === "installed" && (
              <p className="success-text">{t("setup.steps.libreoffice_installed")}</p>
            )}
            {status === "not_installed" && (
              <div className="flex flex-col items-center">
                <p>{t("setup.steps.libreoffice_missing")}</p>
                <button
                  onClick={downloadAndInstall}
                  className="folder-select-button"
                >
                  {t("setup.steps.libreoffice_install_button")}
                </button>
              </div>
            )}
            {status === "downloading" && (
              <p>{t("setup.steps.libreoffice_downloading")}</p>
            )}
          </div>
        );
      },
    },
    {
      id: 6,
      title: t("setup.steps.final_title"),
      description: t("setup.steps.final_description"),
      component: ({ setupData }: { setupData: any }) => (
        <div className="setup-final-step-container">
          <div className="setup-final-step-card">
            <span className="setup-final-step-label">
              {t("setup.steps.final_name_label")}
            </span>
            <span className="setup-final-step-value">
              {setupData.name || t("setup.steps.final_not_specified")}
            </span>
          </div>

          <div className="setup-final-step-card">
            <span className="setup-final-step-label">
              {t("setup.steps.final_folder_label")}
            </span>
            <span className="setup-final-step-value">
              {setupData.folder || t("setup.steps.final_not_specified")}
            </span>
          </div>

          <div className="setup-final-step-card">
            <span className="setup-final-step-label">
              {t("setup.steps.theme_label")}
            </span>
            <span className="setup-final-step-value">{setupData.theme}</span>
          </div>

          <div className="setup-final-step-card">
            <span className="setup-final-step-label">
              {t("setup.steps.formats_label")}
            </span>
            <ul className="setup-final-step-list-formats">
              <li>
                {t("setup.steps.video_label")} {setupData.videoFormat}
              </li>
              <li>
                {t("setup.steps.image_label")} {setupData.imageFormat}
              </li>
              <li>
                {t("setup.steps.archive_label")} {setupData.archiveFormat}
              </li>
              <li>
                {t("setup.steps.document_label")} {setupData.documentFormat}
              </li>
            </ul>
          </div>

          <div className="setup-final-step-card">
            <span className="setup-final-step-label">
              {t("setup.steps.notifications_title")}
            </span>
            <span className="setup-final-step-value">
              {setupData.pushNotifications
                ? t("setup.steps.final_enabled")
                : t("setup.steps.final_disabled")}
            </span>
          </div>
        </div>
      ),
    },
  ];
};
