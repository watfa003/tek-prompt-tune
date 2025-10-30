import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface FeedbackCardProps {
  type: "success" | "warning" | "info";
  title: string;
  icon: ReactNode;
  items: string[];
}

export function FeedbackCard({ type, title, icon, items }: FeedbackCardProps) {
  const colors = {
    success: {
      border: "border-success/40",
      bg: "bg-success/5",
      text: "text-success",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.2)]",
    },
    warning: {
      border: "border-warning/40",
      bg: "bg-warning/5",
      text: "text-warning",
      glow: "shadow-[0_0_20px_rgba(251,191,36,0.2)]",
    },
    info: {
      border: "border-primary/40",
      bg: "bg-primary/5",
      text: "text-primary",
      glow: "shadow-[0_0_20px_rgba(110,231,255,0.2)]",
    },
  };

  const style = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative p-4 rounded-xl border ${style.border} ${style.bg} ${style.glow} backdrop-blur-sm overflow-hidden group hover:${style.glow.replace('0.2', '0.4')} transition-shadow`}
    >
      {/* Animated gradient border effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${type === 'success' ? 'rgba(34,197,94,0.1)' : type === 'warning' ? 'rgba(251,191,36,0.1)' : 'rgba(110,231,255,0.1)'}, transparent)`,
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <div className="relative z-10">
        <div className={`flex items-center gap-2 mb-3 ${style.text} font-medium`}>
          {icon}
          {title}
        </div>
        
        <div className="space-y-2">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className="flex gap-2 text-sm text-foreground/90"
            >
              <ChevronRight className={`h-4 w-4 ${style.text} flex-shrink-0 mt-0.5`} />
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
