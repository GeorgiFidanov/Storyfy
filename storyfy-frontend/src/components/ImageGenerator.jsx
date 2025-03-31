import React, { useState } from 'react';
import LoadingAnimation from './LoadingAnimation';
import './ImageGenerator.css';

const ImageGenerator = ({ track }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      // Step 1: Analyzing music features
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Creating visual elements
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Generating final artwork
      setCurrentStep(2);
      
      // Your existing image generation code here
      // ...
      
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="image-generator">
      {/* Your existing UI components */}
      
      {isGenerating && (
        <LoadingAnimation 
          message={`Creating artwork for "${track.name}"`}
          currentStep={currentStep}
        />
      )}
      
      <button 
        onClick={generateImage}
        disabled={isGenerating}
        className="generate-button"
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </button>
    </div>
  );
};

export default ImageGenerator; 