import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, BarChart3, Repeat, Zap, Star, Lightbulb, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Particles } from "@/components/ui/particles";
import { SpiralAnimation } from "@/components/ui/spiral-animation";
import promptekLogo from "@/assets/promptek-logo.png";
import precisionScoringIcon from "@/assets/precision-scoring.svg";
import crossModelIcon from "@/assets/cross-model-intelligence.svg";
import adaptiveLearningIcon from "@/assets/adaptive-learning.svg";
import turboExecutionIcon from "@/assets/turbo-execution.svg";
import { motion } from "framer-motion";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Floating Particles */}
      <Particles />
      
      {/* Header */}
      <header className="relative border-b border-border/40 backdrop-blur-sm bg-background/80 z-50">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <img src={promptekLogo} alt="Promptek" className="h-20 md:h-24" />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Animated Background */}
      <BackgroundPaths>
        <section className="container mx-auto px-4 py-24 md:py-32 lg:py-36">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6 backdrop-blur-sm"
            >
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">AI-Powered Prompt Optimization</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight"
            >
              Optimize Your AI Prompts. Instantly.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Automatically grade, test, and improve your prompts across multiple AI models.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25 group" asChild>
                <Link to="/auth">
                  Try It Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="hover:bg-primary/5 transition-all hover:scale-105 backdrop-blur-sm border-border/60" asChild>
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative mx-auto max-w-4xl"
            >
              <div className="aspect-video rounded-xl border border-border/40 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="p-8 h-full flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-6 text-primary">
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Brain className="h-14 w-14" />
                      </motion.div>
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <BarChart3 className="h-14 w-14" />
                      </motion.div>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Target className="h-14 w-14" />
                      </motion.div>
                    </div>
                    <p className="text-muted-foreground font-medium">Interactive Demo Coming Soon</p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
            </motion.div>
          </div>
        </section>
      </BackgroundPaths>

      {/* Why Promptek Features */}
      <section className="relative container mx-auto px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
            Why Promptek?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The only tool built to test, score, and improve prompts before you use them
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-10">
          {[
            {
              icon: precisionScoringIcon,
              title: "Precision Scoring",
              description: "Ultra-accurate evaluation metrics with digital precision for every prompt variant.",
              gradient: "from-primary to-primary-glow",
              delay: 0.1
            },
            {
              icon: crossModelIcon,
              title: "Cross-Model Intelligence",
              description: "Test across multiple AI models simultaneously with intelligent collaboration.",
              gradient: "from-accent to-primary",
              delay: 0.2
            },
            {
              icon: adaptiveLearningIcon,
              title: "Adaptive Learning",
              description: "Evolves and improves with every test, learning from your optimization patterns.",
              gradient: "from-primary to-accent",
              delay: 0.3
            },
            {
              icon: turboExecutionIcon,
              title: "Turbo Execution",
              description: "Lightning-fast optimization pipeline delivers results in seconds, not minutes.",
              gradient: "from-accent to-primary-glow",
              delay: 0.4
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
            >
              <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 group h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="relative flex items-center justify-center w-20 h-20 mb-6 group-hover:scale-110 transition-all duration-300">
                    {/* Animated background glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                    {/* Icon container */}
                    <div className="relative flex items-center justify-center w-full h-full">
                      <img 
                        src={feature.icon} 
                        alt={feature.title}
                        className="w-16 h-16 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.7)] transition-all duration-300"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works - Premium Redesign */}
      <section id="how-it-works" className="relative container mx-auto px-4 py-32 overflow-hidden">
        {/* Cosmic Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Animated gradient orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"
          />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 relative z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6 backdrop-blur-sm"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pipeline Intelligence</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Three intelligent steps to transform your prompts
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 lg:gap-16 items-center">
            {[
              {
                number: 1,
                title: "Paste Your Prompt",
                description: "Input your prompt into our intelligent interface. Zero configuration required.",
                gradient: "from-primary via-primary-glow to-primary",
                delay: 0.2,
                icon: "📝"
              },
              {
                number: 2,
                title: "Run Tests",
                description: "AI analyzes across multiple models with real-time scoring metrics.",
                gradient: "from-accent via-primary to-accent",
                delay: 0.4,
                icon: "⚡"
              },
              {
                number: 3,
                title: "View Results",
                description: "Get precision insights, comparisons, and AI-powered optimization suggestions.",
                gradient: "from-primary-glow via-accent to-primary-glow",
                delay: 0.6,
                icon: "📊"
              }
            ].map((step, index) => (
              <React.Fragment key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: step.delay }}
                  className="relative group"
                >
                  {/* Card Container */}
                  <motion.div
                    whileHover={{ y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                    
                    {/* Main Card */}
                    <div className="relative bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl p-8 group-hover:border-primary/50 transition-all duration-500">
                      {/* 3D Holographic Number */}
                      <motion.div
                        whileHover={{ 
                          rotateY: 15,
                          rotateX: -10,
                          scale: 1.1
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="relative mx-auto mb-6"
                        style={{ perspective: "1000px" }}
                      >
                        <div className="relative w-24 h-24 mx-auto">
                          {/* Outer glow */}
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-2xl blur-xl`}
                          />
                          
                          {/* Glass cube */}
                          <div className={`relative w-full h-full bg-gradient-to-br ${step.gradient} rounded-2xl shadow-2xl overflow-hidden`}>
                            {/* Inner glass effect */}
                            <div className="absolute inset-[2px] bg-gradient-to-br from-card/90 via-card/70 to-card/90 rounded-xl" />
                            
                            {/* Shine effect */}
                            <motion.div
                              animate={{
                                backgroundPosition: ["0% 0%", "100% 100%"],
                              }}
                              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                              className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-30"
                              style={{ backgroundSize: "200% 200%" }}
                            />
                            
                            {/* Number */}
                            <div className="relative w-full h-full flex items-center justify-center">
                              <motion.span 
                                className="text-4xl font-bold bg-gradient-to-br from-primary via-accent to-primary-glow bg-clip-text text-transparent"
                                animate={{
                                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                }}
                                transition={{ duration: 5, repeat: Infinity }}
                                style={{ backgroundSize: "200% 200%" }}
                              >
                                {step.number}
                              </motion.span>
                            </div>
                            
                            {/* Reflection */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent rounded-b-2xl" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Content */}
                      <div className="text-center space-y-3">
                        <motion.h3 
                          className="text-2xl font-bold group-hover:text-primary transition-colors duration-300"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ delay: step.delay + 0.2 }}
                        >
                          {step.title}
                        </motion.h3>
                        
                        <motion.p 
                          className="text-muted-foreground leading-relaxed"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ delay: step.delay + 0.3 }}
                        >
                          {step.description}
                        </motion.p>
                      </div>

                      {/* Bottom glow bar */}
                      <motion.div
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${step.gradient} rounded-full group-hover:w-3/4 transition-all duration-500`}
                      />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Animated Flow Arrow */}
                {index < 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: step.delay + 0.3 }}
                    className="hidden md:flex items-center justify-center relative -mx-8 lg:-mx-12"
                  >
                    {/* Animated data flow particles */}
                    <div className="relative w-full h-16">
                      {/* Flow line */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
                        <defs>
                          <linearGradient id={`flow-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity="0.2" />
                            <stop offset="50%" className="[stop-color:hsl(var(--accent))]" stopOpacity="0.8" />
                            <stop offset="100%" className="[stop-color:hsl(var(--primary-glow))]" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        
                        {/* Main flow path */}
                        <motion.path
                          d="M 0 20 Q 25 10, 50 20 T 100 20"
                          stroke={`url(#flow-grad-${index})`}
                          strokeWidth="2"
                          fill="none"
                          initial={{ pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: step.delay + 0.5 }}
                        />
                        
                        {/* Arrow head */}
                        <motion.path
                          d="M 95 16 L 100 20 L 95 24"
                          stroke="url(#flow-grad-${index})"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: step.delay + 1.5 }}
                        />
                      </svg>
                      
                      {/* Flowing particles */}
                      {[0, 0.3, 0.6].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-0 top-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50"
                          animate={{
                            x: ["0%", "100%"],
                            opacity: [0, 1, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: delay,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-20 relative z-10"
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90 transition-all hover:scale-105 shadow-2xl shadow-primary/30 group"
            asChild
          >
            <Link to="/auth">
              Start Optimizing Now 
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block ml-2"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="relative container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center border-border/40 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <Star className="h-6 w-6 text-primary fill-primary" />
            <Star className="h-6 w-6 text-primary fill-primary" />
            <Star className="h-6 w-6 text-primary fill-primary" />
            <Star className="h-6 w-6 text-primary fill-primary" />
          </div>
          <blockquote className="text-xl md:text-2xl font-medium mb-4 italic">
            "Promptek helped us increase AI response quality by 35%. It's a game-changer for our workflow."
          </blockquote>
          <p className="text-muted-foreground">— Beta Tester</p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 opacity-60">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              <span className="text-sm font-medium">OpenAI</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <span className="text-sm font-medium">Anthropic</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Google</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">Mistral</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Bottom CTA with Spiral Animation */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 scale-150 -z-10">
          <SpiralAnimation />
        </div>
        <div className="max-w-4xl mx-auto relative">
          
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Start optimizing your prompts today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users getting better AI results with Promptek
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg" asChild>
                <Link to="/auth">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="hover:bg-primary/5 transition-all hover:scale-105">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 py-12 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={promptekLogo} alt="Promptek" className="h-14 md:h-16" />
            </div>
            <p className="text-muted-foreground text-center">
              © 2025 PrompTek. AI Prompt Optimizer & Prompt Engineering Tool.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;