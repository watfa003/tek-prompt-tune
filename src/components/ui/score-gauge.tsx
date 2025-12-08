import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, maxScore = 10, size = "md" }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const controls = useAnimationControls();

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  const textSizeClasses = {
    sm: "text-3xl",
    md: "text-5xl",
    lg: "text-6xl",
  };

  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Animate the score counting up
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(current);
      }
    }, duration / steps);

    // Animate the circle
    controls.start({
      strokeDashoffset: strokeDashoffset,
      transition: { duration: 1.5, ease: "easeOut" },
    });

    return () => clearInterval(timer);
  }, [score, strokeDashoffset, controls]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "hsl(var(--success))";
    if (score >= 6) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getGlowColor = (score: number) => {
    if (score >= 8) return "0 0 40px hsl(var(--success) / 0.6)";
    if (score >= 6) return "0 0 40px hsl(var(--warning) / 0.6)";
    return "0 0 40px hsl(var(--destructive) / 0.6)";
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          opacity="0.2"
        />
        
        {/* Animated score circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={controls}
          style={{
            filter: `drop-shadow(${getGlowColor(score)})`,
          }}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className={`${textSizeClasses[size]} font-bold gradient-text`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Math.round(displayScore * 10)}%
        </motion.div>
        <motion.div
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {displayScore >= 8 ? 'Excellent' : displayScore >= 6 ? 'Good' : displayScore >= 4 ? 'Fair' : 'Poor'}
        </motion.div>
      </div>
      
      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${getScoreColor(score)}40, transparent 70%)`,
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
