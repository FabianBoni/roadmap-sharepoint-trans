import React, { useState, useEffect } from 'react';

interface JSDoITLoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  minDuration?: number; // Mindestdauer in Millisekunden
  persistent?: boolean; // Bleibt immer sichtbar
}

const JSDoITLoader: React.FC<JSDoITLoaderProps> = ({ 
  size = 'medium', 
  className = '',
  minDuration = 2000, // Standard: 2 Sekunden
  persistent = false // Standard: nicht persistent
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showComplexAnimation, setShowComplexAnimation] = useState(false);

  useEffect(() => {
    // Nach 1 Sekunde zur komplexen Animation wechseln
    const complexAnimationTimer = setTimeout(() => {
      setShowComplexAnimation(true);
    }, 1000);

    // Timer für Mindestanzeigedauer
    const timer = setTimeout(() => {
      if (!persistent) {
        setIsVisible(false);
      }
    }, minDuration);

    return () => {
      clearTimeout(complexAnimationTimer);
      clearTimeout(timer);
    };
  }, [minDuration, persistent]);const sizeConfig = {
    small: { fontSize: '2rem', width: '6ch', simpleSize: '1.5rem' },
    medium: { fontSize: '4rem', width: '6ch', simpleSize: '3rem' },
    large: { fontSize: '6rem', width: '6ch', simpleSize: '4.5rem' }
  };

  const config = sizeConfig[size];

  // Zeige den Loader nur an, wenn er sichtbar sein soll
  if (!isVisible && !persistent) {
    return null;
  }

  // Einfache Animation für die ersten 1 Sekunde
  if (!showComplexAnimation) {
    return (
      <div className={`flex justify-center items-center ${className}`}>
        <div 
          className="inline-block font-mono font-bold"
          style={{
            fontSize: config.simpleSize,
            animation: `pulse 1s ease-in-out infinite`,
          }}
        >
          <span style={{ color: '#ffffff' }}>JS</span>
          <span style={{ color: '#f5c000' }}>Do</span>
          <span style={{ color: '#00bfff' }}>IT</span>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `
        }} />
      </div>
    );
  }

  // Komplexe Animation nach 1 Sekunde
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className="inline-block font-mono font-bold whitespace-nowrap overflow-hidden border-r border-white"
        style={{
          fontSize: config.fontSize,
          width: config.width,
          animation: `
            typing 6s steps(6) infinite,
            blink 1.5s step-end infinite
          `,
        }}
      >
        <span style={{ color: '#ffffff' }}>JS</span>
        <span style={{ color: '#f5c000' }}>Do</span>
        <span style={{ color: '#00bfff' }}>IT</span>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes typing {
            0%, 85%, 100% { width: 0ch; }
            15%, 75% { width: 6ch; }
          }
          @keyframes blink {
            50% { border-color: transparent; }
          }
        `
      }} />
    </div>
  );
};

export default JSDoITLoader;
