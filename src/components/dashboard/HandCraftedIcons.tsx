// Hand-crafted SVG icons for PrompTek dashboard - Original geometric designs
import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  filled?: boolean;
}

// Excellence Badge - Premium geometric star with inner glow
export const ExcellenceBadge: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Excellence badge"
    focusable="false"
  >
    <defs>
      <linearGradient id="excellence-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="1" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill="url(#excellence-grad)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="hsl(var(--background))" opacity="0.3" />
  </svg>
);

// Good Performance Badge - Hexagonal gear shape
export const GoodBadge: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Good performance badge"
    focusable="false"
  >
    <defs>
      <linearGradient id="good-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L16 6L21 6L21 11L16 16L12 22L8 16L3 11L3 6L8 6L12 2Z"
      fill="url(#good-grad)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.5" fill="hsl(var(--background))" opacity="0.4" />
  </svg>
);

// Average Badge - Clean triangular indicator
export const AverageBadge: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Average performance badge"
    focusable="false"
  >
    <path
      d="M12 4L19 18H5L12 4Z"
      fill="hsl(var(--muted))"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Search Icon - Minimalist magnifying glass
export const SearchIcon: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Search"
    focusable="false"
  >
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Filter Icon - Elegant funnel with accent
export const FilterIcon: React.FC<IconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Filter"
    focusable="false"
  >
    <path
      d="M4 6H20M7 12H17M10 18H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Favorite Star - Refined five-point star
export const FavoriteIcon: React.FC<IconProps> = ({ className = "", size = 20, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Favorite"
    focusable="false"
  >
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// Template Category Icons - Original geometric designs

export const WritingIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Writing"
    focusable="false"
  >
    <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M5 16L8 13M16 5L18.5 7.5M8 13L16 5L18.5 7.5L10.5 15.5L5 16L8 13Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const CodingIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Coding"
    focusable="false"
  >
    <path d="M8 8L4 12L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8L20 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 4L11 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const MarketingIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Marketing"
    focusable="false"
  >
    <path d="M3 21L3 13L9 7L15 13L21 7L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="15" cy="13" r="1.5" fill="currentColor" />
    <circle cx="9" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

export const SupportIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Support"
    focusable="false"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Floating Action Button Icon - Optimized lightning bolt
export const OptimizeIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Optimize"
    focusable="false"
  >
    <defs>
      <linearGradient id="optimize-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--accent))" />
      </linearGradient>
    </defs>
    <path
      d="M13 2L3 14H11L10 22L21 10H13L13 2Z"
      fill="url(#optimize-grad)"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
