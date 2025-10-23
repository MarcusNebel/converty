import { applyTheme } from "../../utils/theme";
import { useTranslation } from "react-i18next";
import type { SetupStep as SetupStepType, SetupStepComponentProps } from "../../utils/types";

interface SetupStepProps extends SetupStepComponentProps {
  step: SetupStepType;
}

export default function SetupStep({ step, setupData, updateSetupData }: SetupStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <h2>{step.title}</h2>
      <p>{step.description}</p>
      {step.component && (
        <step.component
          setupData={setupData}
          updateSetupData={updateSetupData}
          applyTheme={applyTheme}
          t={t}
        />
      )}
    </div>
  );
}
