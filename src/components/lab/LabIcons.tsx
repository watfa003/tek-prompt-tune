import React from 'react';

interface IconProps {
  className?: string;
}

export const FlaskIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M9 3V7.5L5 16C4.5 17 4.5 18 5 19C5.5 20 6.5 20 8 20H16C17.5 20 18.5 20 19 19C19.5 18 19.5 17 19 16L15 7.5V3" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="url(#flask-gradient)"
      fillOpacity="0.2"
    />
    <path d="M9 3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="15" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="14" cy="13" r="1.5" fill="currentColor" opacity="0.8"/>
    <circle cx="12" cy="17" r="0.8" fill="currentColor" opacity="0.5"/>
    <defs>
      <linearGradient id="flask-gradient" x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="url(#zap-gradient)"
    />
    <defs>
      <linearGradient id="zap-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
      </linearGradient>
    </defs>
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M6 9C6 6.5 7 5 9 5H15C17 5 18 6.5 18 9C18 11.5 17 13 15 13H9C7 13 6 11.5 6 9Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
      fill="url(#trophy-gradient)"
    />
    <path d="M12 13V17M9 20H15M12 17C12 17 10 17 10 20M12 17C12 17 14 17 14 20" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path d="M6 7H4C3 7 2 8 2 9V10C2 11 3 12 4 12H6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M18 7H20C21 7 22 8 22 9V10C22 11 21 12 20 12H18" stroke="currentColor" strokeWidth="1.5"/>
    <defs>
      <linearGradient id="trophy-gradient" x1="12" y1="5" x2="12" y2="13" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
      </linearGradient>
    </defs>
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L13 7L17 8L13 9L12 13L11 9L7 8L11 7L12 3Z" fill="currentColor" opacity="0.8"/>
    <path d="M19 7L19.5 9L21.5 9.5L19.5 10L19 12L18.5 10L16.5 9.5L18.5 9L19 7Z" fill="currentColor" opacity="0.6"/>
    <path d="M6 16L6.5 18L8.5 18.5L6.5 19L6 21L5.5 19L3.5 18.5L5.5 18L6 16Z" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor" opacity="0.8"/>
    <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const TrendingIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 17L9 11L13 15L21 7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path d="M16 7H21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 12H6L9 3L15 21L18 12H21" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="9" cy="8" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="15" cy="16" r="1" fill="currentColor" opacity="0.6"/>
  </svg>
);
