import React from 'react';

interface TrustBadgeProps {
  score: number; // 0-100
  cancellations: number;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ score, cancellations }) => {
  // Calculate circle circumference for SVG dasharray
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';

  return (
    <div className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-2xl shadow-xl">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#334155"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-[10px] font-bold">{score}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-400">Trust Score</span>
        <span className="text-sm font-bold">{score >= 90 ? 'Excellent' : 'Average'}</span>
        {cancellations > 0 && (
          <span className="text-[10px] text-red-400">{cancellations} penalties applied</span>
        )}
      </div>
    </div>
  );
};
