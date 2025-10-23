import "../../styles/setup/Setup.css";
import { useTranslation } from "react-i18next";

interface SetupButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onFinish: (data?: any) => void;
  setupData?: any;
}

export default function SetupButtons({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onFinish,
  setupData
}: SetupButtonsProps) {
  const isLast = currentStep === totalSteps - 1;
  const { t } = useTranslation();

  const handleFinish = async () => {
    try {
      const success = await window.electron.setup.saveSetupData(setupData);
      if (success) {
        onFinish?.(); // oder navigate weiter
      } else {
        alert("Fehler beim Speichern der Setup-Daten!");
      }
    } catch (err) {
      console.error("Fehler beim Speichern der Setup-Daten:", err);
      alert("Fehler beim Speichern der Setup-Daten!");
    }
  };

  return (
    <div className="setup-buttons">
      <button onClick={onBack} disabled={currentStep === 0}>
        {t("setup.buttons.back")}
      </button>

      <button onClick={isLast ? handleFinish : onNext}>
        {isLast ? t("setup.buttons.finish") : t("setup.buttons.next")}
      </button>
    </div>
  );
}
