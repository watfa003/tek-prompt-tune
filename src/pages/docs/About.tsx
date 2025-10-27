import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Target, Users, Zap } from 'lucide-react';
import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.title = 'About PrompTek | Company';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Learn about PrompTek\'s mission to democratize AI prompt optimization for developers and engineers worldwide.');
    }
  }, []);

  return (
    <DocsLayout
      title="About PrompTek"
      description="Democratizing AI prompt optimization for developers and engineers worldwide."
    >
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Our Mission
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            PrompTek was founded with a simple belief: AI prompt engineering shouldn't be guesswork.
            Engineers and developers deserve tools that bring the same rigor and precision to prompt
            optimization that they apply to writing code.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We're building the definitive platform for prompt testing, optimization, and deployment—enabling
            teams to move from prototype to production with confidence, backed by data and real-world
            performance metrics across every major AI model.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 glass-card border-primary/20">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Precision First</h3>
              <p className="text-sm text-muted-foreground">
                Every feature is designed to provide accurate, actionable insights that improve prompt
                performance measurably.
              </p>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Developer-Centric</h3>
              <p className="text-sm text-muted-foreground">
                Built by engineers for engineers, with workflows that integrate seamlessly into existing
                development processes.
              </p>
            </Card>

            <Card className="p-6 glass-card border-primary/20">
              <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Constantly pushing boundaries with AI-powered learning, multi-model intelligence, and
                cutting-edge optimization techniques.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Our Story
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              PrompTek emerged from a frustration shared by AI engineers everywhere: the lack of systematic
              tools for prompt development. While frameworks for software testing, CI/CD, and version control
              have become industry standards, prompt engineering remained largely manual and inconsistent.
            </p>
            <p>
              In 2024, our founding team—veterans of AI research and software engineering—set out to change
              that. We started by building internal tools to test and optimize prompts for our own projects.
              The results were immediate: higher quality outputs, reduced costs, and faster iteration cycles.
            </p>
            <p>
              Today, PrompTek serves thousands of developers, from solo engineers building AI-powered features
              to enterprise teams deploying production systems at scale. We're proud to be defining the standard
              for professional prompt engineering.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Looking Forward
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            As AI models evolve, so does PrompTek. We're actively developing features for:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <span>Real-time collaborative prompt editing and testing</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <span>Advanced A/B testing with statistical significance analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <span>Automated prompt versioning and rollback capabilities</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <span>Integration with popular development tools and CI/CD pipelines</span>
            </li>
          </ul>
        </section>

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Join Us
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We're always looking for passionate engineers, researchers, and designers who share our vision
            of making AI more accessible and reliable. Check out our{' '}
            <span className="text-primary font-semibold">careers page</span> or reach out to{' '}
            <span className="text-primary font-semibold">careers@promptek.ai</span>.
          </p>
        </section>
      </div>
    </DocsLayout>
  );
}
