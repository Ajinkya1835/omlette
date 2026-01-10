import "./ReportSteps.css";

export default function ReportSteps({ currentStep }) {
  const steps = [
    { number: 1, label: "Details", icon: "📝" },
    { number: 2, label: "Evidence", icon: "📸" },
    { number: 3, label: "Location", icon: "📍" },
    { number: 4, label: "Submit", icon: "✓" }
  ];

  return (
    <div className="report-steps">
      {steps.map((step, index) => (
        <div key={step.number} className="step-wrapper">
          <div className={`step-item ${currentStep >= step.number ? "active" : ""} ${currentStep > step.number ? "completed" : ""}`}>
            <div className="step-circle">
              {currentStep > step.number ? "✓" : step.icon}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
          {index < steps.length - 1 && (
            <div className={`step-connector ${currentStep > step.number ? "active" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}
