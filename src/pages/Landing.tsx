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
            We built this because prompt engineering shouldn't feel like guesswork
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
                  <path d="M24 8C18 8 14 12 14 16c0 2 1 4 2 5-3 1-5 4-5 7 0 4 3 8 7 9 1 2 3 3 6 3s5-1 6-3c4-1 7-5 7-9 0-3-2-6-5-7 1-1 2-3 2-5 0-4-4-8-10-8z" fill="url(#brain-grad)" opacity="0.9"/>
                  <circle cx="20" cy="20" r="2" fill="url(#brain-grad)"/>
                  <circle cx="28" cy="20" r="2" fill="url(#brain-grad)"/>
                  <path d="M18 28c2 2 4 3 6 3s4-1 6-3" stroke="url(#brain-grad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              ),
              title: "Scores That Make Sense",
              description: "Forget token counts. We measure clarity, structure, and actual output quality.",
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
                  <rect x="10" y="28" width="6" height="12" fill="url(#chart-grad)" rx="2"/>
                  <rect x="21" y="20" width="6" height="20" fill="url(#chart-grad)" rx="2" opacity="0.8"/>
                  <rect x="32" y="12" width="6" height="28" fill="url(#chart-grad)" rx="2" opacity="0.9"/>
                  <path d="M8 40h32" stroke="url(#chart-grad)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="13" cy="26" r="2" fill="url(#chart-grad)"/>
                  <circle cx="24" cy="18" r="2" fill="url(#chart-grad)"/>
                  <circle cx="35" cy="10" r="2" fill="url(#chart-grad)"/>
                </svg>
              ),
              title: "Test Across Models",
              description: "GPT-4 loves details. Claude prefers structure. See what works where.",
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
                  <path d="M38 18c0-6-4-10-10-10H16" stroke="url(#repeat-grad)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <path d="M10 32c0 6 4 10 10 10h12" stroke="url(#repeat-grad)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <path d="M12 14l4 4-4 4" stroke="url(#repeat-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M36 26l-4 4 4 4" stroke="url(#repeat-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="24" cy="24" r="3" fill="url(#repeat-grad)" opacity="0.6"/>
                </svg>
              ),
              title: "Learns What Works",
              description: "Track what prompts perform best over time and replicate success.",
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
                  <path d="M26 4L12 24h12l-2 20 14-20H24l2-20z" fill="url(#zap-grad)" stroke="url(#zap-grad)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="18" cy="22" r="1.5" fill="url(#zap-grad)" opacity="0.8"/>
                  <circle cx="30" cy="26" r="1.5" fill="url(#zap-grad)" opacity="0.8"/>
                </svg>
              ),
              title: "No More Waiting",
              description: "Test multiple versions in parallel. Know which prompt wins in seconds.",
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
            Stop guessing. Start testing.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
          {[
            {
              number: 1,
              title: "Paste Your Prompt",
              description: "Drop in whatever you're using. Whether it's 10 words or 500, we'll work with it.",
              gradient: "from-primary to-primary-glow",
              delay: 0.2
            },
            {
              number: 2,
              title: "We Run the Tests",
              description: "Your prompt hits multiple models simultaneously. Real responses, real scores.",
              gradient: "from-accent to-primary",
              delay: 0.4
            },
            {
              number: 3,
              title: "See What Actually Works",
              description: "Side-by-side comparisons, concrete scores, and suggestions based on real output.",
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