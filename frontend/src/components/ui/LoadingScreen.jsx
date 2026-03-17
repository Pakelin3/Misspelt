import React, { useState, useEffect } from 'react';
import TextShuffle from './TextShuffle';

export function LoadingScreen({ onLoadingComplete, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState("opacity-0");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpacity("opacity-100");
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  const handleAnimationComplete = () => {
    if (onLoadingComplete) {
      onLoadingComplete();
    }

    setOpacity("opacity-0");

    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-foreground transition-opacity duration-500 ease-in-out ${opacity}`}>
      <h1 className="font-mono leading-tight">
        <TextShuffle
          text="MISSPELT"
          shuffleDirection="up"
          duration={1}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="back.out(1.1)"
          stagger={0.2}
          threshold={0.1}
          triggerOnce={true}
          triggerOnHover={false}
          respectReducedMotion={true}
          loop={false}
          className="text-background"
          onShuffleComplete={handleAnimationComplete}
        />
      </h1>
    </div>
  );
}

export default LoadingScreen;
