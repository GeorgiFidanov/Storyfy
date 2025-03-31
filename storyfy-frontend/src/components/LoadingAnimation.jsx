import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-message">{message || "Generating your artwork..."}</p>
        <div className="loading-steps">
          <div className="step active">Analyzing music features</div>
          <div className="step">Creating visual elements</div>
          <div className="step">Generating final artwork</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 