import React from 'react';
import { motion } from 'framer-motion';
import { OptimizeIcon } from './HandCraftedIcons';
import { useNavigate } from 'react-router-dom';

export const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/app/ai-agent')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary via-accent to-[hsl(330,100%,69%)] shadow-2xl flex items-center justify-center group overflow-hidden"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Optimize Prompt"
    >
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-[hsl(330,100%,69%)] opacity-50 blur-xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon */}
      <div className="relative z-10">
        <OptimizeIcon className="text-white" size={24} />
      </div>

      {/* Tooltip on hover */}
      <motion.div
        className="absolute bottom-full mb-3 right-0 bg-card border border-white/10 rounded-lg px-3 py-1.5 shadow-xl backdrop-blur-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
        initial={{ y: 10 }}
        whileHover={{ y: 0 }}
      >
        <span className="text-xs font-medium">Optimize Prompt</span>
        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/10" />
      </motion.div>
    </motion.button>
  );
};
