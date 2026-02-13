import React from 'react';

type FlowerType = 'daisy' | 'tulip' | 'sakura';

interface FlowerProps {
  type: FlowerType;
  className?: string;
  delay?: string;
}

const FlowerWrapper: React.FC<{
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}> = ({ className, style, children }) => (
  <div className={`${className} animate-sway`} style={style}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
      {children}
    </svg>
  </div>
);

export const Flower: React.FC<FlowerProps> = ({ type, className = '', delay = '0s' }) => {
  const style = { animationDelay: delay };
  
  if (type === 'daisy') {
    return (
      <FlowerWrapper className={className} style={style}>
        {/* Stem */}
        <path d="M50 100 Q50 60 50 50" stroke="#22c55e" strokeWidth="4" fill="none" />
        <path d="M50 80 Q70 70 80 80" stroke="#22c55e" strokeWidth="4" fill="none" />
        <path d="M50 80 Q30 70 20 80" stroke="#22c55e" strokeWidth="4" fill="none" />
        {/* Petals */}
        <g fill="white">
            <circle cx="50" cy="25" r="10" />
            <circle cx="72" cy="35" r="10" />
            <circle cx="75" cy="60" r="10" />
            <circle cx="50" cy="75" r="10" />
            <circle cx="25" cy="60" r="10" />
            <circle cx="28" cy="35" r="10" />
        </g>
        <circle cx="50" cy="50" r="12" fill="#fbbf24" />
      </FlowerWrapper>
    );
  }
  
  if (type === 'tulip') {
     return (
      <FlowerWrapper className={className} style={style}>
        {/* Stem */}
        <path d="M50 100 Q50 60 50 60" stroke="#22c55e" strokeWidth="4" />
        <path d="M50 100 Q30 75 25 55" stroke="#22c55e" strokeWidth="4" fill="none" />
        <path d="M50 100 Q70 75 75 55" stroke="#22c55e" strokeWidth="4" fill="none" />
        
        {/* Bulb */}
        <path d="M35 40 Q35 75 50 80 Q65 75 65 40 L58 50 L50 35 L42 50 Z" fill="#f43f5e" />
      </FlowerWrapper>
    );
  }

  // Sakura / Cherry Blossom
  return (
    <FlowerWrapper className={className} style={style}>
       {/* Stem */}
       <path d="M50 100 Q55 80 50 60" stroke="#8D6E63" strokeWidth="3" fill="none" />
       
       {/* Flower */}
       <g transform="translate(50, 50) scale(1.1)">
          {[0, 72, 144, 216, 288].map((angle) => (
            <path 
                key={angle}
                d="M0 0 C-5 -12 -12 -18 0 -28 C12 -18 5 -12 0 0" 
                fill="#f472b6" 
                transform={`rotate(${angle})`} 
            />
          ))}
          <circle cx="0" cy="0" r="5" fill="#fce7f3" />
       </g>
    </FlowerWrapper>
  );
};