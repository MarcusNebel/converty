import "../../styles/setup/Setup.css";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className={`dot ${index === currentStep ? "active" : ""}`} />
      ))}
    </div>
  );
}
