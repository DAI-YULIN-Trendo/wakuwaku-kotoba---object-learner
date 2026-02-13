import React from 'react';
import { BearProps } from '../types';

export const Bear: React.FC<BearProps> = ({ expression }) => {
  // Pika-style cute monster
  
  const getEyes = () => {
    if (expression === 'thinking') {
      return (
        <g>
           {/* Squiggly confused eyes */}
           <path d="M30 52 Q35 45 40 52 Q45 59 30 52" stroke="#333" strokeWidth="2" fill="none" />
           <path d="M60 52 Q65 45 70 52 Q75 59 60 52" stroke="#333" strokeWidth="2" fill="none" />
        </g>
      );
    }
    if (expression === 'talking') {
      // Happy open eyes
      return (
        <g>
          <circle cx="35" cy="50" r="6" fill="#222" />
          <circle cx="37" cy="48" r="2.5" fill="white" />
          <circle cx="65" cy="50" r="6" fill="#222" />
          <circle cx="67" cy="48" r="2.5" fill="white" />
        </g>
      );
    }
    // Default happy
    return (
      <g>
        <circle cx="35" cy="50" r="6" fill="#222" />
        <circle cx="37" cy="48" r="2.5" fill="white" />
        <circle cx="65" cy="50" r="6" fill="#222" />
        <circle cx="67" cy="48" r="2.5" fill="white" />
      </g>
    );
  };

  const getMouth = () => {
    if (expression === 'talking') {
      // Open mouth D shape
      return <path d="M 42 62 Q 50 72 58 62 Z" fill="#D45B5B" stroke="#442222" strokeWidth="2" strokeLinejoin="round" />;
    }
    if (expression === 'thinking') {
      // Small circle mouth
      return <circle cx="50" cy="65" r="3" fill="none" stroke="#442222" strokeWidth="2" />;
    }
    // Happy '3' mouth
    return <path d="M 40 62 Q 45 66 50 62 Q 55 66 60 62" stroke="#442222" strokeWidth="3" strokeLinecap="round" fill="none" />;
  };

  const getCheeks = () => {
    // Electric cheeks spark when happy/talking
    const isSparking = expression === 'talking' || expression === 'happy';
    return (
      <g>
        <circle cx="25" cy="65" r="7" fill="#EF4444" opacity="0.8" className={isSparking ? 'animate-pulse' : ''} />
        <circle cx="75" cy="65" r="7" fill="#EF4444" opacity="0.8" className={isSparking ? 'animate-pulse' : ''} />
      </g>
    );
  };

  return (
    <div className={`relative w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 transition-transform duration-300 flex-shrink-0 ${expression === 'talking' ? 'animate-bounce' : 'animate-float'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
        {/* Left Ear */}
        <g transform="translate(15, 10) rotate(-25)">
          <ellipse cx="10" cy="20" rx="8" ry="25" fill="#FACC15" /> 
          {/* Ear Tip */}
          <path d="M2 20 Q10 -15 18 20 Z" fill="#222" transform="translate(0, -10) scale(1, 0.6)" />
        </g>

        {/* Right Ear */}
        <g transform="translate(85, 10) rotate(25)">
           <ellipse cx="-10" cy="20" rx="8" ry="25" fill="#FACC15" />
           {/* Ear Tip */}
           <path d="M-18 20 Q-10 -15 -2 20 Z" fill="#222" transform="translate(0, -10) scale(1, 0.6)" />
        </g>
        
        {/* Head Base */}
        <circle cx="50" cy="55" r="38" fill="#FACC15" />
        
        {/* Dynamic Features */}
        {getCheeks()}
        {getEyes()}
        {getMouth()}
        
        {/* Nose */}
        <circle cx="50" cy="58" r="1.5" fill="#222" />
        
      </svg>
    </div>
  );
};
