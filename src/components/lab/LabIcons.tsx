import React from 'react';

interface IconProps {
  className?: string;
}

export const FlaskIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flask-fill" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.05"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.25"/>
      </linearGradient>
      <linearGradient id="flask-liquid" x1="12" y1="10" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.15"/>
      </linearGradient>
    </defs>
    
    {/* Flask body */}
    <path 
      d="M9 2.5C9 2.22386 9.22386 2 9.5 2H14.5C14.7761 2 15 2.22386 15 2.5V7.5L19.5 16.5C20 17.5 20 18.5 19.5 19.5C19 20.5 18 21 16.5 21H7.5C6 21 5 20.5 4.5 19.5C4 18.5 4 17.5 4.5 16.5L9 7.5V2.5Z" 
      fill="url(#flask-fill)"
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Liquid level */}
    <path 
      d="M6 17C6 17 7 16.5 9 16.5C11 16.5 12 17.5 14 17.5C16 17.5 18 17 18 17L18.5 18C18.8 18.5 18.8 19 18.5 19.3C18.2 19.6 17.5 20 16.5 20H7.5C6.5 20 5.8 19.6 5.5 19.3C5.2 19 5.2 18.5 5.5 18L6 17Z" 
      fill="url(#flask-liquid)"
    />
    
    {/* Flask neck */}
    <path d="M9.5 2H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Bubbles */}
    <circle cx="10" cy="16" r="1" fill="currentColor" opacity="0.4" className="animate-pulse"/>
    <circle cx="14" cy="14.5" r="1.2" fill="currentColor" opacity="0.5" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
    <circle cx="11.5" cy="18" r="0.7" fill="currentColor" opacity="0.3" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="target-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </radialGradient>
    </defs>
    
    {/* Outer ring */}
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      opacity="0.2"
    />
    
    {/* Middle ring */}
    <circle 
      cx="12" 
      cy="12" 
      r="6.5" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      opacity="0.4"
    />
    
    {/* Inner ring */}
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="url(#target-center)"
      opacity="0.6"
    />
    
    {/* Center dot */}
    <circle 
      cx="12" 
      cy="12" 
      r="1.5" 
      fill="currentColor"
      className="animate-pulse"
    />
    
    {/* Crosshair lines */}
    <path d="M12 1V4.5M12 19.5V23M1 12H4.5M19.5 12H23" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      opacity="0.3"
    />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zap-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
      </linearGradient>
    </defs>
    
    {/* Lightning bolt */}
    <path 
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
      fill="url(#zap-gradient)"
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Energy glow */}
    <path 
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
      fill="none"
      stroke="currentColor" 
      strokeWidth="0.5" 
      opacity="0.5"
      style={{filter: 'blur(2px)'}}
    />
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trophy-cup" x1="12" y1="4" x2="12" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="trophy-base" x1="12" y1="17" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    
    {/* Trophy cup */}
    <path 
      d="M8 4H16C17.1046 4 18 4.89543 18 6V9C18 11.2091 16.2091 13 14 13H10C7.79086 13 6 11.2091 6 9V6C6 4.89543 6.89543 4 8 4Z"
      fill="url(#trophy-cup)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    
    {/* Trophy handles */}
    <path 
      d="M6 6H4C3.44772 6 3 6.44772 3 7V9C3 9.55228 3.44772 10 4 10H6" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path 
      d="M18 6H20C20.5523 6 21 6.44772 21 7V9C21 9.55228 20.5523 10 20 10H18" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    
    {/* Trophy stem */}
    <path 
      d="M12 13V17" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    
    {/* Trophy base */}
    <path 
      d="M8 21H16C16.5523 21 17 20.5523 17 20C17 19.4477 16.5523 19 16 19H8C7.44772 19 7 19.4477 7 20C7 20.5523 7.44772 21 8 21Z"
      fill="url(#trophy-base)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    
    {/* Shine effect */}
    <path 
      d="M10 6L11 8" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sparkle-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </radialGradient>
    </defs>
    
    {/* Main sparkle */}
    <path 
      d="M12 2L13.5 8L19.5 9.5L13.5 11L12 17L10.5 11L4.5 9.5L10.5 8L12 2Z" 
      fill="url(#sparkle-center)"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinejoin="round"
      className="animate-pulse"
    />
    
    {/* Top right sparkle */}
    <path 
      d="M18 5L18.7 7L20.7 7.7L18.7 8.4L18 10.4L17.3 8.4L15.3 7.7L17.3 7L18 5Z" 
      fill="currentColor"
      opacity="0.7"
      className="animate-pulse"
      style={{animationDelay: '0.2s'}}
    />
    
    {/* Bottom left sparkle */}
    <path 
      d="M6 14L6.7 16L8.7 16.7L6.7 17.4L6 19.4L5.3 17.4L3.3 16.7L5.3 16L6 14Z" 
      fill="currentColor"
      opacity="0.6"
      className="animate-pulse"
      style={{animationDelay: '0.4s'}}
    />
    
    {/* Small accent sparkle */}
    <circle cx="19" cy="19" r="1" fill="currentColor" opacity="0.5" className="animate-pulse" style={{animationDelay: '0.6s'}}/>
  </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bar1" x1="5" y1="11" x2="5" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.2"/>
      </linearGradient>
      <linearGradient id="bar2" x1="12" y1="7" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.25"/>
      </linearGradient>
      <linearGradient id="bar3" x1="19" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
    
    {/* Base line */}
    <path d="M2 21H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    
    {/* Bar 1 */}
    <rect 
      x="3" 
      y="11" 
      width="4" 
      height="10" 
      rx="1.5" 
      fill="url(#bar1)"
      stroke="currentColor"
      strokeWidth="1"
    />
    
    {/* Bar 2 */}
    <rect 
      x="10" 
      y="7" 
      width="4" 
      height="14" 
      rx="1.5" 
      fill="url(#bar2)"
      stroke="currentColor"
      strokeWidth="1"
    />
    
    {/* Bar 3 */}
    <rect 
      x="17" 
      y="3" 
      width="4" 
      height="18" 
      rx="1.5" 
      fill="url(#bar3)"
      stroke="currentColor"
      strokeWidth="1"
    />
    
    {/* Highlight dots */}
    <circle cx="5" cy="13" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="12" cy="9" r="1" fill="currentColor" opacity="0.6"/>
    <circle cx="19" cy="5" r="1" fill="currentColor" opacity="0.7"/>
  </svg>
);

export const TrendingIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trend-line" x1="3" y1="17" x2="21" y2="7" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8"/>
      </linearGradient>
    </defs>
    
    {/* Trend line */}
    <path 
      d="M3 17L9 11L13 15L21 7" 
      stroke="url(#trend-line)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Arrow head */}
    <path 
      d="M15 7H21V13" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Data points */}
    <circle cx="3" cy="17" r="2" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1"/>
    <circle cx="9" cy="11" r="2.5" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1"/>
    <circle cx="13" cy="15" r="2.5" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="1"/>
    <circle cx="21" cy="7" r="2" fill="currentColor" opacity="0.7" stroke="currentColor" strokeWidth="1"/>
    
    {/* Glow effect */}
    <path 
      d="M3 17L9 11L13 15L21 7" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      opacity="0.1"
      style={{filter: 'blur(4px)'}}
    />
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="activity-line" x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
        <stop offset="30%" stopColor="currentColor" stopOpacity="0.7"/>
        <stop offset="70%" stopColor="currentColor" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
    
    {/* Activity wave */}
    <path 
      d="M2 12H5L8 4L13 20L16 12H22" 
      stroke="url(#activity-line)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* Peak indicators */}
    <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.6" className="animate-pulse"/>
    <circle cx="13" cy="16" r="1.5" fill="currentColor" opacity="0.6" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
    
    {/* Baseline */}
    <path d="M2 12H22" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="2 2"/>
    
    {/* Glow effect */}
    <path 
      d="M2 12H5L8 4L13 20L16 12H22" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
      opacity="0.08"
      style={{filter: 'blur(3px)'}}
    />
  </svg>
);
