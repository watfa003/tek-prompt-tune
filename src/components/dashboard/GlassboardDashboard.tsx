import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExcellenceBadge, GoodBadge, AverageBadge } from './HandCraftedIcons';
import { TrendingTemplates } from './TrendingTemplates';
import { FloatingActionButton } from './FloatingActionButton';
import { usePromptData } from '@/context/PromptDataContext';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from 'next-themes';
import { Sun, Moon, Minimize2, Maximize2 } from 'lucide-react';

export const GlassboardDashboard = () => {
  const { analytics, loading } = usePromptData();
  const { settings, setSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(settings.compactMode || false);

  const toggleCompactMode = () => {
    const newCompactMode = !compactMode;
    setCompactMode(newCompactMode);
    setSettings({ ...settings, compactMode: newCompactMode });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Loading your analytics...</p>
        </motion.div>
      </div>
    );
  }

  const getBestProvider = () => {
    if (!analytics?.usage?.providerStats) return 'No data';
    const providers = Object.entries(analytics.usage.providerStats);
    if (providers.length === 0) return 'No data';

    const best = providers.reduce(
      (best, [name, stats]: [string, any]) => (stats.avgScore > best.score ? { name, score: stats.avgScore } : best),
      { name: '', score: 0 }
    );

    return best.name || 'No data';
  };

  const getScoreBadgeIcon = (score: number) => {
    if (score >= 0.8) return <ExcellenceBadge size={20} className="text-primary" />;
    if (score >= 0.6) return <GoodBadge size={20} className="text-primary" />;
    return <AverageBadge size={20} className="text-muted-foreground" />;
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="text-center glass-card p-12 rounded-3xl max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M13 2L3 14H11L10 22L21 10H13L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Welcome to PrompTek</h3>
          <p className="text-muted-foreground mb-6">Start optimizing prompts to unlock your personalized dashboard</p>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">Get Started</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden box-border pb-8">
      {/* Animated Background Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px]"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Theme & Compact Mode Controls */}
      <motion.div
        className="fixed top-20 right-4 z-40 flex items-center gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.button>

        <motion.button
          onClick={toggleCompactMode}
          className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle compact mode"
        >
          {compactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className={`space-y-8 md:space-y-12 relative z-10 w-full max-w-full ${compactMode ? 'compact-mode' : ''}`}>
        {/* Hero Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
          {[
            {
              label: 'Prompts Generated',
              value: analytics?.overview?.totalPrompts || 0,
              gradient: 'from-primary/20 to-primary-glow/20',
              delay: 0,
            },
            {
              label: 'Avg Score',
              value: analytics?.overview?.averageScore?.toFixed(2) || '0.0',
              gradient: 'from-accent/20 to-primary/20',
              delay: 0.1,
            },
            {
              label: 'Best Provider',
              value: getBestProvider(),
              gradient: 'from-[hsl(330,100%,69%)]/20 to-accent/20',
              delay: 0.2,
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: metric.delay, duration: 0.5 }}
              whileHover={{ y: -12, scale: 1.02 }}
              className="w-full max-w-full"
            >
              <Card className="glass-card p-6 sm:p-8 md:p-10 backdrop-blur-xl border-white/10 rounded-2xl relative overflow-hidden group w-full hover:border-primary/20">
                {/* Hover reflection sweep */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.8 }}
                />

                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-40 group-hover:opacity-50 transition-opacity duration-300`} />

                {/* Subtle glow on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(110, 231, 255, 0.1), transparent 70%)',
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-3 truncate font-medium uppercase tracking-wider">{metric.label}</div>
                  <motion.div 
                    className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text truncate"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: metric.delay + 0.2, duration: 0.4 }}
                  >
                    {metric.value}
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trending Templates Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <TrendingTemplates />
        </motion.div>

        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="glass-card p-8 md:p-10 backdrop-blur-xl border-white/10 rounded-2xl hover:border-primary/15">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path
                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Score Distribution
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: 'Excellent',
                  range: '0.8+',
                  count: analytics?.performance?.scoreDistribution?.excellent || 0,
                  gradient: 'from-green-500/20 to-green-400/20',
                  textColor: 'text-green-400',
                  borderColor: 'border-green-500/20',
                },
                {
                  label: 'Good',
                  range: '0.6-0.8',
                  count: analytics?.performance?.scoreDistribution?.good || 0,
                  gradient: 'from-yellow-500/20 to-yellow-400/20',
                  textColor: 'text-yellow-400',
                  borderColor: 'border-yellow-500/20',
                },
                {
                  label: 'Average',
                  range: '0.4-0.6',
                  count: analytics?.performance?.scoreDistribution?.average || 0,
                  gradient: 'from-orange-500/20 to-orange-400/20',
                  textColor: 'text-orange-400',
                  borderColor: 'border-orange-500/20',
                },
                {
                  label: 'Poor',
                  range: '0-0.4',
                  count: analytics?.performance?.scoreDistribution?.poor || 0,
                  gradient: 'from-red-500/20 to-red-400/20',
                  textColor: 'text-red-400',
                  borderColor: 'border-red-500/20',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="relative"
                >
                  <div className={`p-6 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.borderColor} hover:border-opacity-40 transition-all duration-300`}>
                    <motion.div 
                      className={`text-4xl font-bold ${item.textColor} mb-2`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.4 }}
                    >
                      {item.count}
                    </motion.div>
                    <div className="text-sm font-medium text-foreground mb-1">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.range}</div>
                    
                    {/* Progress bar */}
                    <motion.div
                      className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${item.gradient.replace('/20', '/60')}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.count / Math.max(analytics?.overview?.totalPrompts || 1, 1)) * 100, 100)}%` }}
                        transition={{ delay: 0.9 + index * 0.05, duration: 0.6, ease: "easeOut" }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity - Scrollable Glass Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card className="glass-card backdrop-blur-2xl border-white/10 rounded-2xl overflow-hidden hover:border-primary/15">
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  Recent Activity
                </h3>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">Last 5</Badge>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="divide-y divide-white/5">
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="p-6 hover:bg-white/5 transition-all group cursor-pointer relative"
                      whileHover={{ x: 6, backgroundColor: 'rgba(110, 231, 255, 0.03)' }}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getScoreBadgeIcon(activity.score || 0)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">Prompt Optimization</span>
                              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/30">
                                {activity.provider || 'Unknown'}
                              </Badge>
                              {activity.model && activity.model !== 'N/A' && (
                                <Badge variant="outline" className="text-xs bg-accent/5 border-accent/30">
                                  {activity.model}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  activity.status === 'completed' 
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                }`}
                              >
                                {activity.status || 'completed'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.createdAt ? new Date(activity.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Recent'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {settings.showScores && (
                            <div className="text-xl font-bold gradient-text">
                              {((activity.score || 0) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : null}

                {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <h4 className="font-semibold mb-2">No recent activity</h4>
                    <p className="text-sm text-muted-foreground">Start optimizing prompts to see your activity here</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
};
