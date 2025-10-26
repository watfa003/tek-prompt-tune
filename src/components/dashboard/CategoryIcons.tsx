import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ProductivityIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M14 8L14 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 8L24 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M34 8L34 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 20H40" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="18" cy="28" r="1.5" fill="currentColor"/>
    <circle cx="24" cy="28" r="1.5" fill="currentColor"/>
    <circle cx="30" cy="28" r="1.5" fill="currentColor"/>
    <path d="M16 33L20 37L28 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WritingIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 38L10 42L14 40L34 20L28 14L12 38Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M28 14L34 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="35.5" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M18 32L16 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="32" y="10" width="7" height="7" rx="1" transform="rotate(45 32 10)" stroke="currentColor" strokeWidth="2.5" fill="none"/>
  </svg>
);

export const CodeIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M6 18H42" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
    <circle cx="17" cy="14" r="1.5" fill="currentColor"/>
    <circle cx="22" cy="14" r="1.5" fill="currentColor"/>
    <path d="M16 26L20 30L16 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 34H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const MarketingIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 28L18 18L28 26L40 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M32 14H40V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="6" y="28" width="4" height="12" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="14" y="22" width="4" height="18" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="22" y="26" width="4" height="14" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="30" y="18" width="4" height="22" rx="1" fill="currentColor"/>
  </svg>
);

export const AnalyticsIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M24 24L24 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 24L35 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 8V12M24 36V40M40 24H36M12 24H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M24 24 A16 16 0 0 1 35.5 29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3"/>
  </svg>
);

export const CreativeIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
    <circle cx="30" cy="18" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
    <circle cx="24" cy="28" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
    <path d="M24 12L28 8L32 12L28 16L24 12Z" fill="currentColor" opacity="0.4"/>
    <path d="M24 36L28 40L32 36L28 32L24 36Z" fill="currentColor" opacity="0.4"/>
    <path d="M12 24L8 28L12 32L16 28L12 24Z" fill="currentColor" opacity="0.4"/>
    <path d="M36 24L32 28L36 32L40 28L36 24Z" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const BusinessIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="14" width="28" height="26" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M16 14V10C16 8.89543 16.8954 8 18 8H30C31.1046 8 32 8.89543 32 10V14" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M10 22H38" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="20" y="28" width="8" height="6" rx="1" fill="currentColor" opacity="0.6"/>
    <circle cx="24" cy="18" r="1.5" fill="currentColor"/>
  </svg>
);

export const EducationIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M24 10L6 18L24 26L42 18L24 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M6 18V28L24 36L42 28V18" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M24 26V36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M14 22L14 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M34 22L34 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const CustomIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M24 10V14M24 34V38M38 24H34M14 24H10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M33.5 14.5L30.5 17.5M17.5 30.5L14.5 33.5M33.5 33.5L30.5 30.5M17.5 17.5L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.4"/>
    <path d="M24 16L26 18L24 20L22 18L24 16Z" fill="currentColor"/>
    <path d="M24 28L26 30L24 32L22 30L24 28Z" fill="currentColor"/>
    <path d="M16 24L18 26L16 28L14 26L16 24Z" fill="currentColor"/>
    <path d="M32 24L34 26L32 28L30 26L32 24Z" fill="currentColor"/>
  </svg>
);

export const SupportIcon: React.FC<IconProps> = ({ className = "text-primary", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M24 24C24 20 20 18 20 14C20 11.7909 21.7909 10 24 10C26.2091 10 28 11.7909 28 14C28 18 24 20 24 24Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <circle cx="24" cy="32" r="2" fill="currentColor"/>
    <path d="M12 18L8 14M36 18L40 14M12 30L8 34M36 30L40 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);
