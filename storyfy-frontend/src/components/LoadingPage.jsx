import { useState, useEffect } from 'react';

function LoadingPage({ generationSteps }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'Analyzing audio features...',
    'Creating visual elements...',
    'Generating unique artwork...',
    'Applying final touches...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-page">
      <div className="loading-animation">
        <div className="spinner"></div>
        <div className="loading-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoadingPage; 