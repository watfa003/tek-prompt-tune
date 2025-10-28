import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, BarChart3, Repeat, Zap, Star, Lightbulb, Target, Sparkles, CheckCircle2, Mail, MapPin, Twitter, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Particles } from "@/components/ui/particles";
import { SpiralAnimation } from "@/components/ui/spiral-animation";
import promptekLogo from "@/assets/promptek-logo.png";
import precisionScoringIcon from "@/assets/precision-scoring.svg";
import crossModelIcon from "@/assets/cross-model-intelligence.svg";
import adaptiveLearningIcon from "@/assets/adaptive-learning.svg";
import turboExecutionIcon from "@/assets/turbo-execution.svg";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 64);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse parallax for hero
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX - innerWidth / 2) / 50);
    mouseY.set((clientY - innerHeight / 2) / 50);
  };

  return (
    <div className="min-h-screen overflow-x-hidden isolate">
      {/* SEO Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PrompTek",
          "url": "https://promptek.ai",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://promptek.ai/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
      
      {/* Floating Particles */}
      <Particles />
      
      {/* Sticky Glass Header with shrink animation */}
      <motion.header 
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'border-b border-border/60 backdrop-blur-xl bg-background/90 shadow-xl shadow-primary/5' 
            : 'border-b border-border/40 backdrop-blur-sm bg-background/80'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <nav 
          className="container mx-auto px-4 transition-all duration-300"
          aria-label="Main navigation"
        >
          <div className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'py-3' : 'py-6'
          }`}>
            <Link to="/" className="flex items-center">
              <img 
                src={promptekLogo} 
                alt="PrompTek - AI Prompt Optimizer" 
                className={`object-contain transition-all duration-300 ${scrolled ? 'h-14 md:h-16' : 'h-20 md:h-24'}`}
              />
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/docs/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/docs/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/docs/documentation" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Docs
              </Link>
              <Link to="/docs/api" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                API
              </Link>
              <Link to="/docs/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Blog
              </Link>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                asChild
                className="relative overflow-hidden group"
              >
                <Link to="/auth">
                  <span className="relative z-10">Sign In</span>
                  <motion.div
                    className="absolute inset-0 bg-primary/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                  />
                </Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30" 
                asChild
              >
                <Link to="/auth" aria-label="Get started with PrompTek prompt optimizer">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-24 md:h-32" />

      {/* Hero Section with Parallax & SEO */}
      <BackgroundPaths>
        <section 
          className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32 overflow-hidden min-h-[90vh] flex items-center"
          onMouseMove={handleMouseMove}
        >
          {/* Parallax background layers */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent pointer-events-none"
            aria-hidden="true"
          />
          
          <div className="max-w-6xl mx-auto text-center w-full relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6 backdrop-blur-sm"
            >
              <Zap className="h-4 w-4 text-primary animate-pulse" aria-hidden="true" />
              <span className="text-sm font-medium">AI-Powered Prompt Optimization</span>
            </motion.div>
            
            {/* Main H1 with keyword optimization and neon glow */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight relative"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
                  Prompt Optimizer
                </span>
                {/* Animated sheen effect */}
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent bg-clip-text text-transparent"
                  animate={{
                    x: ['-200%', '200%']
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                  aria-hidden="true"
                />
                {/* Soft neon glow */}
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent blur-xl opacity-30" aria-hidden="true">
                  Prompt Optimizer
                </span>
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                for AI Prompts. Instantly.
              </span>
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
              {/* Primary CTA - Neon glass with 3D lift */}
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-2xl shadow-primary/30 group overflow-hidden min-w-[200px] h-12 text-base font-semibold" 
                asChild
              >
                <Link to="/auth" aria-label="Try PrompTek prompt optimizer now">
                  <span className="relative z-10 flex items-center gap-2">
                    Try It Now 
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {/* Pulsing glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </Link>
              </Button>
              
              {/* Secondary CTA - Glass outline */}
              <Button 
                variant="outline" 
                size="lg" 
                className="relative hover:bg-primary/10 transition-all backdrop-blur-sm border-border/60 hover:border-primary/40 group min-w-[200px] h-12 text-base" 
                asChild
              >
                <a href="#how-it-works" aria-label="Learn how PrompTek prompt optimizer works">
                  <span className="relative z-10">Learn How It Works</span>
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary to-accent w-0 group-hover:w-full transition-all duration-300"
                  />
                </a>
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
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
            </motion.div>
          </div>
        </section>
      </BackgroundPaths>

      {/* Why Promptek Features - SEO Optimized */}
      <section className="relative container mx-auto px-4 py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
        
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

        {/* SEO: Product Feature structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Product",
                  "name": "Precision Scoring",
                  "description": "Ultra-accurate evaluation metrics with digital precision for every prompt variant in our prompt optimizer."
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "Product",
                  "name": "Cross-Model Intelligence",
                  "description": "Test across multiple AI models simultaneously with intelligent collaboration in our prompt engineering tool."
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "Product",
                  "name": "Adaptive Learning",
                  "description": "Evolves and improves with every test, learning from your prompt optimization patterns."
                }
              },
              {
                "@type": "ListItem",
                "position": 4,
                "item": {
                  "@type": "Product",
                  "name": "Turbo Execution",
                  "description": "Lightning-fast prompt optimization pipeline delivers results in seconds, not minutes."
                }
              }
            ]
          })}
        </script>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-10">
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
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
              aria-label={feature.title}
            >
              <motion.div
                whileHover={{ 
                  y: -8,
                  rotateY: 5,
                  rotateX: -5 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ perspective: "1000px" }}
              >
                <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 group h-full relative overflow-hidden">
                  {/* Animated gradient sweep on hover */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))`
                    }}
                  />
                  
                  {/* Neon glow orb */}
                  <motion.div 
                    className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <div className="relative z-10">
                    {/* Icon with 3D tilt and neon outline */}
                    <motion.div 
                      className="relative flex items-center justify-center w-20 h-20 mb-6 group-hover:scale-110 transition-all duration-300"
                      whileHover={{ rotateY: 15, rotateX: -10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {/* Animated background glow */}
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity`}
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Icon container with stroke animation */}
                      <div className="relative flex items-center justify-center w-full h-full">
                        <img 
                          src={feature.icon} 
                          alt={`${feature.title} - PrompTek prompt optimizer feature`}
                          className="w-16 h-16 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] group-hover:drop-shadow-[0_0_16px_rgba(139,92,246,0.8)] transition-all duration-300"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Neon outline ring */}
                      <motion.div
                        className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/30`}
                        animate={{
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Animated border gradient on hover */}
                  <motion.div
                    className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3))`,
                      padding: '1px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude'
                    }}
                  />
                </Card>
              </motion.div>
            </motion.section>
          ))}
        </div>
      </section>

      {/* How It Works - Premium Redesign with SEO */}
      <section id="how-it-works" className="relative container mx-auto px-4 py-16 md:py-24 overflow-hidden scroll-mt-24">
        {/* SEO: HowTo Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Use PrompTek Prompt Optimizer",
            "description": "Learn how to optimize your AI prompts in three simple steps using PrompTek's prompt optimization tool.",
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Paste Your Prompt",
                "text": "Input your prompt into our intelligent interface for prompt optimization. Zero configuration required.",
                "url": "https://promptek.ai#how-it-works"
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Run Tests",
                "text": "AI analyzes your prompt across multiple models with real-time scoring metrics in our prompt optimizer.",
                "url": "https://promptek.ai#how-it-works"
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "View Results",
                "text": "Get precision insights, comparisons, and AI-powered optimization suggestions for your prompts.",
                "url": "https://promptek.ai#how-it-works"
              }
            ]
          })}
        </script>

        {/* Cosmic Background with animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {/* Animated gradient orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-0 right-1/4 w-[350px] h-[350px] md:w-[600px] md:h-[600px] bg-accent/20 rounded-full blur-3xl"
          />
          
          {/* Floating particles - optimized for performance */}
          {[...Array(15)].map((_, i) => (
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
          
          {/* Subtle waveform */}
          <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10" preserveAspectRatio="none" viewBox="0 0 1200 100">
            <motion.path
              d="M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z"
              fill="url(#wave-gradient)"
              initial={{ d: "M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z" }}
              animate={{ d: "M0,50 Q300,100 600,50 T1200,50 L1200,100 L0,100 Z" }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.3 }} />
                <stop offset="50%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
          </svg>
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
            <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium">Pipeline Intelligence</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Three intelligent steps to transform your prompts
          </p>
        </motion.div>

        {/* Steps Container - Semantic HTML for SEO */}
        <div className="max-w-6xl mx-auto relative z-10">
          <ol className="grid md:grid-cols-3 gap-8 md:gap-6 items-center list-none">
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
                <motion.li
                  itemProp="step"
                  itemScope
                  itemType="https://schema.org/HowToStep"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: step.delay }}
                  className="relative group"
                  aria-label={`Step ${step.number}: ${step.title}`}
                >
                  <meta itemProp="position" content={step.number.toString()} />
                  <meta itemProp="name" content={step.title} />
                  <meta itemProp="text" content={step.description} />
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
                </motion.li>

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
          </ol>
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

      {/* Social Proof & Testimonials - SEO Optimized */}
      <section className="relative container mx-auto px-4 py-20">
        {/* SEO: Review structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            "itemReviewed": {
              "@type": "SoftwareApplication",
              "name": "PrompTek Prompt Optimizer"
            },
            "author": {
              "@type": "Person",
              "name": "Beta Tester"
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "reviewBody": "Promptek helped us increase AI response quality by 35%. It's a game-changer for our workflow."
          })}
        </script>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center border-border/40 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm relative overflow-hidden group">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{ backgroundSize: "200% 200%" }}
            />
            
            <div className="relative z-10">
              {/* Animated star rating */}
              <motion.div 
                className="flex items-center justify-center gap-2 mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="h-6 w-6 text-primary fill-primary" aria-hidden="true" />
                  </motion.div>
                ))}
              </motion.div>
              
              <figure>
                <blockquote className="text-xl md:text-2xl font-medium mb-4 italic">
                  "Promptek helped us increase AI response quality by 35%. It's a game-changer for our workflow."
                </blockquote>
                <figcaption className="text-muted-foreground">— Beta Tester</figcaption>
              </figure>
              
              {/* Logo carousel with grayscale hover reveal */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-8 mt-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { icon: Lightbulb, name: "OpenAI", label: "OpenAI - AI model provider" },
                  { icon: Brain, name: "Anthropic", label: "Anthropic Claude - AI model provider" },
                  { icon: Sparkles, name: "Google", label: "Google Gemini - AI model provider" },
                  { icon: Zap, name: "Mistral", label: "Mistral AI - AI model provider" }
                ].map((provider, i) => (
                  <motion.div
                    key={provider.name}
                    className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-300 group/logo"
                    whileHover={{ scale: 1.1, y: -2 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 0.6, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <provider.icon className="h-5 w-5 grayscale group-hover/logo:grayscale-0 transition-all" aria-hidden="true" />
                    <span className="text-sm font-medium grayscale group-hover/logo:grayscale-0 transition-all" aria-label={provider.label}>
                      {provider.name}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Parallax glow effect */}
            <motion.div
              className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50"
              animate={{
                scale: [1, 1.2, 1],
                x: [-10, 10, -10],
                y: [-10, 10, -10],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </Card>
        </motion.div>
      </section>

      {/* Final CTA - Parallax with waveform */}
      <section className="relative container mx-auto px-4 py-32 overflow-hidden">
        {/* Parallax stars background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 flex items-center justify-center opacity-60 scale-150">
            <SpiralAnimation />
          </div>
          
          {/* Faint waveform */}
          <svg className="absolute bottom-0 left-0 w-full h-40 opacity-20" preserveAspectRatio="none" viewBox="0 0 1200 100">
            <motion.path
              d="M0,50 Q200,20 400,50 T800,50 T1200,50 L1200,100 L0,100 Z"
              fill="url(#wave-cta)"
              animate={{
                d: [
                  "M0,50 Q200,20 400,50 T800,50 T1200,50 L1200,100 L0,100 Z",
                  "M0,50 Q200,80 400,50 T800,50 T1200,50 L1200,100 L0,100 Z",
                  "M0,50 Q200,20 400,50 T800,50 T1200,50 L1200,100 L0,100 Z"
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="wave-cta" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.4 }} />
                <stop offset="50%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: "hsl(var(--primary-glow))", stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center space-y-8">
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent relative"
              initial={{ scale: 0.95 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              Start optimizing your prompts today
              {/* Subtle glow */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent blur-2xl opacity-30" aria-hidden="true">
                Start optimizing your prompts today
              </span>
            </motion.h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users getting better AI results with Promptek
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {/* Primary pill CTA with shimmer */}
              <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="lg" 
                  className="relative bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90 transition-all shadow-2xl shadow-primary/40 overflow-hidden min-w-[200px] h-14 text-lg font-semibold px-10 rounded-full group"
                  asChild
                >
                  <Link to="/auth" aria-label="Get started with PrompTek prompt optimizer">
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </span>
                    
                    {/* Animated shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                      style={{ width: '100%' }}
                    />
                    
                    {/* Pulse on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-accent to-primary rounded-full opacity-0 group-hover:opacity-50 blur-xl transition-opacity"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </Link>
                </Button>
              </motion.div>
              
              {/* Secondary underline text button */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="relative hover:bg-primary/10 transition-all border-border/60 hover:border-primary/50 group min-w-[200px] h-14 text-lg rounded-full backdrop-blur-sm"
                >
                  <span className="relative z-10">View Documentation</span>
                  
                  {/* Slide-up hover effect */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-t from-primary/20 to-transparent group-hover:h-full transition-all duration-300 rounded-full"
                  />
                  
                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-primary to-accent w-0 group-hover:w-3/4 transition-all duration-300 rounded-full"
                  />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer - SEO Optimized with structured data */}
      <footer className="relative border-t border-border/40 py-16 bg-background/80 backdrop-blur-xl" role="contentinfo">
        {/* SEO: Organization structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "PrompTek",
            "url": "https://promptek.ai",
            "logo": "https://promptek.ai/promptek-logo.png",
            "description": "PrompTek is the ultimate AI prompt optimizer and prompt engineering platform.",
            "sameAs": [
              "https://twitter.com/promptek",
              "https://linkedin.com/company/promptek",
              "https://github.com/promptek"
            ]
          })}
        </script>

        {/* Gradient reflection effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />
        
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center mb-4">
                <img 
                  src={promptekLogo} 
                  alt="PrompTek - AI Prompt Optimizer" 
                  className="object-contain h-14 md:h-16"
                />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The ultimate prompt optimizer for AI engineers and developers.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-4">
                {[
                  { icon: Twitter, label: "Twitter", href: "https://twitter.com/promptek" },
                  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/promptek" },
                  { icon: Github, label: "GitHub", href: "https://github.com/promptek" }
                ].map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow PrompTek on ${social.label}`}
                    className="p-2 rounded-lg border border-border/40 bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    whileHover={{ y: -2, scale: 1.05 }}
                  >
                    <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>
            
            {/* Product Links - SEO keyword-rich */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <nav className="flex flex-col gap-3" aria-label="Product links">
              {[
                  { label: "Prompt Optimizer Features", href: "/docs/features" },
                  { label: "Prompt Engineering Tool", href: "/docs/engineering" },
                  { label: "AI Model Testing", href: "/docs/testing" },
                  { label: "Pricing", href: "/docs/pricing" }
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {link.label}
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -5 }}
                      whileHover={{ x: 0 }}
                    >
                      →
                    </motion.span>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Resources</h3>
              <nav className="flex flex-col gap-3" aria-label="Resource links">
              {[
                  { label: "Documentation", href: "/docs/documentation" },
                  { label: "API Reference", href: "/docs/api" },
                  { label: "Prompt Templates", href: "/docs/templates" },
                  { label: "Blog", href: "/docs/blog" }
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {link.label}
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -5 }}
                      whileHover={{ x: 0 }}
                    >
                      →
                    </motion.span>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <nav className="flex flex-col gap-3" aria-label="Company links">
              {[
                  { label: "About", href: "/docs/about" },
                  { label: "Contact", href: "/docs/contact", icon: Mail },
                  { label: "Privacy Policy", href: "/docs/privacy" },
                  { label: "Terms of Service", href: "/docs/terms" }
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {link.icon && <link.icon className="h-3 w-3" aria-hidden="true" />}
                    {link.label}
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -5 }}
                      whileHover={{ x: 0 }}
                    >
                      →
                    </motion.span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Animated horizontal rule */}
          <motion.div
            className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © 2025 PrompTek. AI Prompt Optimizer & Prompt Engineering Tool. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" className="hover:text-primary transition-colors">Sitemap</a>
              <span>•</span>
              <a href="/robots.txt" className="hover:text-primary transition-colors">Robots</a>
            </div>
          </div>
        </div>
        
        {/* Subtle gradient reflection of logo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none blur-3xl" aria-hidden="true" />
      </footer>
    </div>
  );
};

export default Landing;