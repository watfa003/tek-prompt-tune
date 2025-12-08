// Centralized score utilities for consistent formatting across the app

export type ScoreLabel = "Excellent" | "Good" | "Fair" | "Poor";

/**
 * Get score label based on score value (0-10 scale)
 * Consistent thresholds: >=8 Excellent, >=6 Good, >=4 Fair, <4 Poor
 */
export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Fair";
  return "Poor";
}

/**
 * Get score color class based on score value
 */
export function getScoreColorClass(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-yellow-400";
  if (score >= 4) return "text-orange-400";
  return "text-red-400";
}

/**
 * Get score background class based on score value
 */
export function getScoreBgClass(score: number): string {
  if (score >= 8) return "bg-green-500/10 border-green-500/20";
  if (score >= 6) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 4) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

/**
 * Format score as percentage (0-100%)
 */
export function formatScoreAsPercentage(score: number): string {
  const percentage = Math.round(score * 10);
  return `${percentage}%`;
}

/**
 * Format score with label for display
 */
export function formatScoreWithLabel(score: number): string {
  return `${formatScoreAsPercentage(score)} ${getScoreLabel(score)}`;
}
