import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Target, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PrompTek
            </span>
          </div>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign Up</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Self-Optimizing Prompt Generator
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatically generate, test, and optimize prompts across multiple AI providers. 
            Get better results with less effort using advanced prompt engineering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="shadow-primary" asChild>
              <Link to="/auth">
                Start Optimizing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful AI Optimization</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Advanced prompt engineering made simple with automated testing and optimization
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Provider Support</h3>
            <p className="text-muted-foreground">
              Works with OpenAI, Anthropic Claude, Google Gemini, Groq, and more. 
              Compare performance across different AI models.
            </p>
          </Card>

          <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-accent rounded-lg mb-4">
              <Target className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Optimization</h3>
            <p className="text-muted-foreground">
              Automatically generates prompt variants and scores them based on output quality, 
              relevance, and structure.
            </p>
          </Card>

          <Card className="p-6 shadow-card border-border/40 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
            <p className="text-muted-foreground">
              Track prompt performance over time with detailed metrics and insights 
              to improve your AI interactions.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center shadow-card border-border/40 bg-gradient-accent">
          <h2 className="text-3xl font-bold mb-4 text-accent-foreground">
            Ready to optimize your prompts?
          </h2>
          <p className="text-accent-foreground/80 mb-8 text-lg">
            Start generating better AI responses today with PrompTek's advanced optimization engine.
          </p>
          <Button size="lg" variant="secondary" className="shadow-lg" asChild>
            <Link to="/auth">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 PrompTek. Built for the future of AI optimization.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;