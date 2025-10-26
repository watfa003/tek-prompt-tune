import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  History, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Rocket,
  Plus,
  Moon,
  Sun,
  Minimize2,
  Maximize2
} from "lucide-react";
import { usePromptData } from "@/context/PromptDataContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { historyItems, analytics } = usePromptData();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const stats = [
    {
      label: "Prompts Generated",
      value: historyItems.length || "0",
      change: "+12%",
      trend: "up",
      icon: Rocket,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Avg Score",
      value: analytics.averageScore ? `${(analytics.averageScore * 100).toFixed(0)}%` : "—",
      change: "+8%",
      trend: "up",
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Best Provider",
      value: analytics.topProvider || "—",
      change: "OpenAI",
      trend: "neutral",
      icon: BarChart3,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const recentItems = historyItems.slice(0, 5);

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return { icon: "✨", label: "Excellent" };
    if (score >= 0.6) return { icon: "⚙️", label: "Good" };
    return { icon: "📝", label: "Average" };
  };

  return (
    <div className={`min-h-screen safe-page ${compactMode ? 'compact-mode' : ''}`}>
      {/* Animated Particle Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Controls: Theme & Compact Mode */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all shadow-lg"
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCompactMode(!compactMode)}
          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all shadow-lg"
        >
          {compactMode ? <Maximize2 className="h-5 w-5 text-primary" /> : <Minimize2 className="h-5 w-5 text-primary" />}
        </motion.button>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text leading-tight">
                Command Center
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Your AI prompt optimization workspace
              </p>
            </div>
          </div>
        </motion.div>

        {/* Hero Metrics Row - Glassboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <Card className="relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 rounded-[24px] p-6 md:p-8 hover:border-primary/30 transition-all duration-500">
                {/* Sweep Highlight Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                
                {/* Icon with Gradient */}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                
                {/* Value */}
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 font-heading">
                  {stat.value}
                </div>
                
                {/* Label & Change */}
                <div className="flex items-center justify-between">
                  <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                    {stat.change}
                  </Badge>
                </div>
                
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[24px]`} />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity - Scrollable Glass Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 font-heading">
              <History className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              Recent Activity
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/app/history")}
              className="group hover:bg-white/5 text-sm md:text-base"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {recentItems.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 font-heading">No optimizations yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Start your first prompt optimization to see results here
                  </p>
                  <Button
                    onClick={() => navigate("/app/ai-agent")}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-glow text-base"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Create First Prompt
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto content-scroll">
                <AnimatePresence>
                  {recentItems.map((item, index) => {
                    const scoreData = getScoreIcon(item.score);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                        onClick={() => navigate("/app/history")}
                        className="p-4 md:p-6 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                            {/* Score Icon */}
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl md:text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                              {scoreData.icon}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-sm md:text-base truncate font-heading">
                                  {item.title}
                                </h3>
                                <Badge variant="outline" className="text-xs border-white/20">
                                  {item.provider}
                                </Badge>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground truncate">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                                  {scoreData.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Score Display */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-2xl md:text-3xl font-bold gradient-text font-heading">
                                {(item.score * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">Score</div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
                          </div>
                        </div>
                        
                        {/* Divider Glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/app/ai-agent")}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-2xl hover:shadow-glow z-50 group"
      >
        <Plus className="h-7 w-7 md:h-8 md:w-8 text-white" />
        
        {/* Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 opacity-75"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </div>
  );
};

export default Index;
