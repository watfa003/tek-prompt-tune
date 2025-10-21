import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, BarChart3, Repeat, Zap, Star, Lightbulb, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Particles } from "@/components/ui/particles";
import { SpiralAnimation } from "@/components/ui/spiral-animation";
import promptekLogo from "@/assets/promptek-logo.png";
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
              svg: (
                <svg viewBox="0 0 48 48" className="w-8 h-8">
                  <defs>
                    <linearGradient id="brain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
                      <stop offset="100%" className="[stop-color:hsl(var(--primary-glow))]" />
                    </linearGradient>
                  </defs>
                  {/* Brain stem */}
                  <path d="M24 42v-8" stroke="url(#brain-grad)" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Left hemisphere */}
                  <path d="M16 18c-4 0-6 3-6 6 0 4 2 7 6 8 1 0 2-1 2-2v-10c0-1-1-2-2-2z" fill="url(#brain-grad)" opacity="0.85"/>
                  {/* Right hemisphere */}
                  <path d="M32 18c4 0 6 3 6 6 0 4-2 7-6 8-1 0-2-1-2-2v-10c0-1 1-2 2-2z" fill="url(#brain-grad)" opacity="0.85"/>
                  {/* Neural connections */}
                  <circle cx="20" cy="22" r="1.5" fill="url(#brain-grad)" opacity="0.9"/>
                  <circle cx="28" cy="22" r="1.5" fill="url(#brain-grad)" opacity="0.9"/>
                  <circle cx="20" cy="28" r="1.5" fill="url(#brain-grad)" opacity="0.9"/>
                  <circle cx="28" cy="28" r="1.5" fill="url(#brain-grad)" opacity="0.9"/>
                  {/* Connection lines */}
                  <path d="M20 22 L24 24 L28 22" stroke="url(#brain-grad)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                  <path d="M20 28 L24 26 L28 28" stroke="url(#brain-grad)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                  {/* Top curve */}
                  <path d="M18 18 Q24 12 30 18" stroke="url(#brain-grad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              ),
              title: "Accurate Scoring",
              description: "Get objective metrics on prompt quality, clarity, and performance across different models.",
              gradient: "from-primary to-primary-glow",
              delay: 0.1
            },
            {
              svg: (
                <svg viewBox="0 0 48 48" className="w-8 h-8">
                  <defs>
                    <linearGradient id="chart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--accent))]" />
                      <stop offset="100%" className="[stop-color:hsl(var(--primary))]" />
                    </linearGradient>
                  </defs>
                  {/* Bars with rounded tops */}
                  <rect x="8" y="28" width="7" height="14" fill="url(#chart-grad)" rx="3.5" opacity="0.75"/>
                  <rect x="19" y="18" width="7" height="24" fill="url(#chart-grad)" rx="3.5" opacity="0.85"/>
                  <rect x="30" y="10" width="7" height="32" fill="url(#chart-grad)" rx="3.5" opacity="0.95"/>
                  {/* Trend line connecting tops */}
                  <path d="M11.5 28 Q22.5 15 33.5 10" stroke="url(#chart-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="0.5 3"/>
                  {/* Data points */}
                  <circle cx="11.5" cy="28" r="2.5" fill="url(#chart-grad)">
                    <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="22.5" cy="18" r="2.5" fill="url(#chart-grad)">
                    <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" begin="0.3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="33.5" cy="10" r="2.5" fill="url(#chart-grad)">
                    <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                  </circle>
                  {/* Axis */}
                  <path d="M6 42h36" stroke="url(#chart-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                </svg>
              ),
              title: "Cross-Model Testing",
              description: "Test your prompts across multiple AI models simultaneously to find the best fit.",
              gradient: "from-accent to-primary",
              delay: 0.2
            },
            {
              svg: (
                <svg viewBox="0 0 48 48" className="w-8 h-8">
                  <defs>
                    <linearGradient id="repeat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--primary))]" />
                      <stop offset="100%" className="[stop-color:hsl(var(--accent))]" />
                    </linearGradient>
                  </defs>
                  {/* Circular arrow path */}
                  <path d="M24 8 A16 16 0 1 1 8 24" stroke="url(#repeat-grad)" strokeWidth="3" fill="none" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite"/>
                  </path>
                  {/* Arrow head */}
                  <path d="M8 20 L8 28 L14 24 Z" fill="url(#repeat-grad)">
                    <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite"/>
                  </path>
                  {/* Center icon representing data/learning */}
                  <circle cx="24" cy="24" r="6" fill="none" stroke="url(#repeat-grad)" strokeWidth="2" opacity="0.6"/>
                  <circle cx="24" cy="24" r="2" fill="url(#repeat-grad)">
                    <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  {/* Data points around circle */}
                  <circle cx="24" cy="16" r="1.5" fill="url(#repeat-grad)" opacity="0.8"/>
                  <circle cx="32" cy="24" r="1.5" fill="url(#repeat-grad)" opacity="0.8"/>
                  <circle cx="24" cy="32" r="1.5" fill="url(#repeat-grad)" opacity="0.8"/>
                </svg>
              ),
              title: "Learning Over Time",
              description: "Our AI learns from your testing patterns to provide better optimization suggestions.",
              gradient: "from-primary to-accent",
              delay: 0.3
            },
            {
              svg: (
                <svg viewBox="0 0 48 48" className="w-8 h-8">
                  <defs>
                    <linearGradient id="zap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="[stop-color:hsl(var(--accent))]" />
                      <stop offset="100%" className="[stop-color:hsl(var(--primary-glow))]" />
                    </linearGradient>
                  </defs>
                  {/* Lightning bolt with dynamic effect */}
                  <path d="M27 6 L15 24 h10 l-3 18 L34 22 h-10 Z" fill="url(#zap-grad)" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite"/>
                  </path>
                  {/* Energy particles */}
                  <circle cx="20" cy="20" r="1.5" fill="url(#zap-grad)">
                    <animate attributeName="cy" values="20;18;20" dur="1s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="28" cy="28" r="1.5" fill="url(#zap-grad)">
                    <animate attributeName="cy" values="28;26;28" dur="1s" begin="0.3s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="24" cy="14" r="1" fill="url(#zap-grad)" opacity="0.7">
                    <animate attributeName="r" values="1;1.5;1" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                  {/* Spark lines */}
                  <path d="M27 6 L29 4 M27 6 L25 4" stroke="url(#zap-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
                  <path d="M22 42 L20 44 M22 42 L24 44" stroke="url(#zap-grad)" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
                </svg>
              ),
              title: "Speed Mode",
              description: "Get results in seconds with our optimized testing pipeline.",
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
                  <div className={`relative flex items-center justify-center w-16 h-16 mb-4 group-hover:scale-110 transition-all duration-300`}>
                    {/* Animated background blur */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity`} />
                    {/* Icon container with gradient border effect */}
                    <div className={`relative flex items-center justify-center w-full h-full bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <div className="absolute inset-[2px] bg-card/95 rounded-xl" />
                      <div className="relative">{feature.svg}</div>
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

      {/* How It Works */}
      <section id="how-it-works" className="relative container mx-auto px-4 py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-accent/80 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to better prompts
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
          {[
            {
              number: 1,
              title: "Paste Your Prompt",
              description: "Simply paste your prompt into our interface. No special formatting required.",
              gradient: "from-primary to-primary-glow",
              delay: 0.2
            },
            {
              number: 2,
              title: "Run Tests",
              description: "Our AI tests your prompt across different models and scoring metrics.",
              gradient: "from-accent to-primary",
              delay: 0.4
            },
            {
              number: 3,
              title: "View Results",
              description: "Get detailed scores, comparisons, and actionable suggestions to improve your prompts.",
              gradient: "from-primary-glow to-accent",
              delay: 0.6
            }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: step.delay }}
              className="relative text-center group"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl mx-auto mb-6 shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/40 transition-shadow`}
              >
                <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
              </motion.div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              
              {/* Arrow - only show between steps on desktop */}
              {index < 2 && (
                <motion.div 
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="hidden md:block absolute top-8 -right-4 text-primary/30"
                >
                  <ArrowRight className="h-8 w-8" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
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