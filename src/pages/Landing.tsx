import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Brain, BarChart3, Repeat, Zap, Star, Lightbulb, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Particles } from "@/components/ui/particles";
import { SpiralAnimation } from "@/components/ui/spiral-animation";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Floating Particles */}
      <Particles />
      
      {/* Header */}
      <header className="relative border-b border-border/40 backdrop-blur-sm bg-background/80 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Promptek
            </span>
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
        <section className="container mx-auto px-4 py-32 md:py-40 lg:py-48">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6 animate-fade-in backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Prompt Optimization</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
              Optimize Your AI Prompts.<br />Instantly.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Automatically grade, test, and improve your prompts across multiple AI models.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25" asChild>
                <Link to="/auth">
                  Try It Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="hover:bg-primary/5 transition-all hover:scale-105 backdrop-blur-sm" asChild>
                <a href="#how-it-works">Learn How It Works</a>
              </Button>
            </div>

            <div className="relative mx-auto max-w-4xl">
              <div className="aspect-video rounded-xl border border-border/40 bg-card backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="p-8 h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 text-primary">
                      <Brain className="h-12 w-12 animate-pulse" />
                      <BarChart3 className="h-12 w-12 animate-pulse" style={{ animationDelay: '0.3s' }} />
                      <Target className="h-12 w-12 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <p className="text-muted-foreground">Interactive Demo Coming Soon</p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-2xl -z-10" />
            </div>
          </div>
        </section>
      </BackgroundPaths>

      {/* Why Promptek Features */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Promptek</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Advanced prompt engineering powered by intelligent automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-glow rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Grading</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Evaluate prompts intelligently with advanced scoring algorithms, not just by length or tokens.
            </p>
          </Card>

          <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/10 group">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Model-Specific Insights</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              See how GPT-4, Claude, Gemini, and Mistral respond differently to your prompts.
            </p>
          </Card>

          <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/10 group">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Repeat className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Self-Optimizing Engine</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Promptek learns which strategies work best and continuously improves suggestions.
            </p>
          </Card>

          <Card className="p-6 border-border/40 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/10 group">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-accent to-primary-glow rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Feedback</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Grade, compare, and iterate in seconds. No waiting for manual reviews.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to better AI prompts
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="relative text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mx-auto mb-6 shadow-lg shadow-primary/25">
              <span className="text-2xl font-bold text-primary-foreground">1</span>
            </div>
            <h3 className="text-2xl font-semibold mb-3">Input Your Prompt</h3>
            <p className="text-muted-foreground leading-relaxed">
              Type your prompt or import from history. Describe your task and let Promptek handle the rest.
            </p>
            {/* Arrow */}
            <div className="hidden md:block absolute top-8 -right-4 text-primary/30">
              <ArrowRight className="h-8 w-8" />
            </div>
          </div>

          <div className="relative text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl mx-auto mb-6 shadow-lg shadow-accent/25">
              <span className="text-2xl font-bold text-accent-foreground">2</span>
            </div>
            <h3 className="text-2xl font-semibold mb-3">AI Tests & Grades</h3>
            <p className="text-muted-foreground leading-relaxed">
              Promptek runs your prompt through multiple AI models and analyzes the results.
            </p>
            {/* Arrow */}
            <div className="hidden md:block absolute top-8 -right-4 text-accent/30">
              <ArrowRight className="h-8 w-8" />
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-glow to-accent rounded-2xl mx-auto mb-6 shadow-lg shadow-primary-glow/25">
              <span className="text-2xl font-bold text-primary-foreground">3</span>
            </div>
            <h3 className="text-2xl font-semibold mb-3">Get Scores & Suggestions</h3>
            <p className="text-muted-foreground leading-relaxed">
              Refine instantly with actionable feedback and optimized prompt variants.
            </p>
          </div>
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
        <div className="max-w-4xl mx-auto relative">
          
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Start optimizing your prompts today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users getting better AI results with Promptek
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative inline-flex rounded-md overflow-hidden">
                <div className="absolute inset-0 opacity-60 pointer-events-none">
                  <SpiralAnimation />
                </div>
                <Button size="lg" className="relative bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg" asChild>
                  <Link to="/auth">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
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
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Promptek
              </span>
            </div>
            <p className="text-muted-foreground text-center">
              &copy; 2024 Promptek. Built for the future of AI optimization.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;