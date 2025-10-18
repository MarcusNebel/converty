import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSetup } from "../utils/setupStatus";
import { setupSteps } from "../utils/setupSteps";
import SetupButtons from "../components/SetupButtons";
import StepIndicator from "../components/StepIndicator";
import IntroScreen from "../components/IntroScreen";
import { applyTheme } from "../utils/theme";

export default function SetupWizard({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fade, setFade] = useState(true); // fade-in / fade-out für Übergang
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  const [setupData, setSetupData] = useState({
    name: "",
    folder: "",
    theme: "light",
    videoFormat: "mp4",
    imageFormat: "jpg",
    archiveFormat: "zip",
    documentFormat: "pdf",
    pushNotifications: true,
  });

  const updateSetupData = (key: string, value: any) => {
    setSetupData((prev) => ({ ...prev, [key]: value }));
  };

  const step = setupSteps[currentStep];
  const StepComp = step.component;

  const next = async () => {
    if (currentStep < setupSteps.length - 1) {
      setFade(false); // fade-out starten
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setFade(true); // fade-in für neuen Step
      }, 300); // Dauer der Animation (ms)
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
        setCurrentStep((s) => s - 1);
        setFade(true);
      }, 300);
    }
  };

  const finish = async () => {
    const success = await window.electron.setup.saveSetupData(setupData);
    if (success) {
      onSetupComplete(); // signalisiert parent, dass Setup fertig ist
      navigate("/");     // leitet auf Dashboard/Home weiter
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
          <StepIndicator currentStep={currentStep} totalSteps={setupSteps.length} />

          {/* Step-Container mit Fade */}
          <div className={`setup-step-container ${fade ? "fade-in" : "fade-out"}`}>
            <div className="setup-step-left">
              <h2 className="setup-step-title">{step.title}</h2>
            </div>

            <div className="setup-step-right">
              <p className="setup-step-description">{step.description}</p>
              <div className="setup-step-right-options">
                {StepComp && <StepComp setupData={setupData} updateSetupData={updateSetupData} applyTheme={(t) => applyTheme(t)} />}
              </div>
            </div>
          </div>

          <SetupButtons
            currentStep={currentStep}
            totalSteps={setupSteps.length}
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
