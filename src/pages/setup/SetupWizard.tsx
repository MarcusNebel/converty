import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSetup } from "../../utils/setup/setupStatus";
import { setupSteps } from "../../utils/setup/setupSteps";
import SetupButtons from "../../components/setup/SetupButtons";
import StepIndicator from "../../components/setup/StepIndicator";
import IntroScreen from "../../components/setup/IntroScreen";
import { applyTheme } from "../../utils/theme";
import type { SetupStep } from "../../utils/types";
import { useTranslation } from "react-i18next";

export default function SetupWizard({ onSetupComplete }: { onSetupComplete: () => void }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [fade, setFade] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  const steps: SetupStep[] = setupSteps();
  const step = steps[currentStep];
  const StepComp = step.component;

  const [setupData, setSetupData] = useState({
    name: "",
    folder: "",
    theme: "system",
    videoFormat: "mp4",
    imageFormat: "jpg",
    archiveFormat: "zip",
    documentFormat: "pdf",
    pushNotifications: true,
  });

  const updateSetupData = (key: string, value: any) => {
    setSetupData(prev => ({ ...prev, [key]: value }));
  };

  const next = async () => {
    if (currentStep < steps.length - 1) {
      setFade(false);
      setTimeout(() => {
        setCurrentStep(s => s + 1);
        setFade(true);
      }, 300);
    } else {
      await completeSetup();
      onSetupComplete();
      navigate("/");
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setFade(false);
      setTimeout(() => {
        setCurrentStep(s => s - 1);
        setFade(true);
      }, 300);
    }
  };

  const finish = async () => {
    const success = await window.electron.setup.saveSetupData(setupData);
    if (success) {
      onSetupComplete();
      navigate("/");
    } else {
      alert("Fehler beim Speichern der Setup-Daten!");
    }
  };

  return (
    <div className="setup-wizard">
      {/* Splashscreen */}
      <div
        className={`intro-wrapper ${showIntro ? "fade-in" : "fade-out"}`}
        style={{ pointerEvents: showIntro ? "auto" : "none" }}
      >
        <IntroScreen onFinish={() => setShowIntro(false)} />
      </div>

      <div className={`setup-container-wrapper ${showIntro ? "hidden" : "visible"}`}>
        <div className="setup-container">
          <StepIndicator currentStep={currentStep} totalSteps={steps.length} />

          <div className={`setup-step-container ${fade ? "fade-in" : "fade-out"}`}>
            <div className="setup-step-left">
              <h2 className="setup-step-title">{t(step.title)}</h2>
            </div>

            <div className="setup-step-right">
              <p className="setup-step-description">{t(step.description)}</p>
              <div className="setup-step-right-options">
                {StepComp ? (
                  <StepComp
                    setupData={setupData}
                    updateSetupData={updateSetupData}
                    applyTheme={applyTheme}
                    t={t}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <SetupButtons
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={next}
            onBack={back}
            onFinish={finish}
            setupData={setupData}
          />
        </div>
      </div>
    </div>
  );
}
