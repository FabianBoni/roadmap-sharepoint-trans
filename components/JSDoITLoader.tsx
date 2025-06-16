import React from 'react';

interface JSDoITLoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const JSDoITLoader: React.FC<JSDoITLoaderProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const sizeConfig = {
    small: { fontSize: '2rem', width: '6ch' },
    medium: { fontSize: '4rem', width: '6ch' },
    large: { fontSize: '6rem', width: '6ch' }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className="inline-block font-mono font-bold whitespace-nowrap overflow-hidden border-r border-white"
        style={{
          fontSize: config.fontSize,
          width: config.width,
          animation: `
            typing 3s steps(6) infinite,
            blink 0.75s step-end infinite
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
            0%, 90%, 100% { width: 0ch; }
            10%, 80% { width: 6ch; }
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
