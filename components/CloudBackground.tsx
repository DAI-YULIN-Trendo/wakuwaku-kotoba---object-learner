import React from 'react';

export const CloudBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Sky Gradient handled in parent */}
      
      {/* Cloud 1 */}
      <div className="absolute top-10 -left-20 animate-cloud-slow opacity-80">
        <svg width="150" height="80" viewBox="0 0 100 60" fill="white">
          <path d="M10 40 Q20 10 40 30 Q50 0 70 30 Q90 20 90 40 Q100 60 50 60 Q0 60 10 40" />
        </svg>
      </div>

      {/* Cloud 2 */}
      <div className="absolute top-32 -left-20 animate-cloud-fast opacity-60 scale-75" style={{ animationDelay: '5s' }}>
        <svg width="120" height="70" viewBox="0 0 100 60" fill="white">
          <path d="M10 40 Q20 10 40 30 Q50 0 70 30 Q90 20 90 40 Q100 60 50 60 Q0 60 10 40" />
        </svg>
      </div>
      
       {/* Cloud 3 */}
      <div className="absolute top-20 -left-20 animate-cloud-slow opacity-70 scale-125" style={{ animationDelay: '15s', top: '15%' }}>
         <svg width="180" height="100" viewBox="0 0 100 60" fill="white">
          <path d="M10 40 Q20 10 40 30 Q50 0 70 30 Q90 20 90 40 Q100 60 50 60 Q0 60 10 40" />
        </svg>
      </div>
    </div>
  );
};
