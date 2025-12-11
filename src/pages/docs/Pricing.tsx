import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Pricing | PrompTek';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Transparent pricing for PrompTek prompt optimization platform. Free tier for getting started, Pro for teams and power users.');
    }
  }, []);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with prompt optimization',
      features: [
        '50 optimizations per month',
        'Access to all AI models',
        '8-pillar scoring system',
        'Community templates',
        'Lab testing (Single & Battle)',
        'Email support',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For professionals optimizing prompts at scale',
      features: [
        'Unlimited optimizations',
        'All AI models (GPT-5, Claude Opus 4, etc.)',
        'Advanced analytics & insights',
        'Custom templates & sharing',
        'API access & integrations',
        'Speed Mode & Deep Mode',
        'Priority support',
        'Team collaboration',
      ],
      cta: 'Start Pro Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For organizations with advanced requirements',
      features: [
        'Everything in Pro',
        'Custom API rate limits',
        'SSO & advanced security',
        'Dedicated infrastructure',
        'SLA guarantees',
        'Custom integrations',
        'Account manager',
        'Training & onboarding',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <DocsLayout
      title="Pricing"
      description="Choose the plan that fits your prompt engineering needs. Start free, scale as you grow."
    >
      <div className="space-y-12">
        <section className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-6 glass-card relative ${
                plan.highlighted
                  ? 'border-primary shadow-[0_0_30px_rgba(110,231,255,0.3)]'
                  : 'border-primary/20'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                className={`w-full mb-6 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                    : ''
                }`}
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {plan.cta}
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </section>

        <section className="border-t border-primary/10 pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Can I switch plans anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and can arrange
                invoicing for Enterprise customers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Is there a free trial for Pro?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! New users get a 14-day free trial of Pro with full access to all features.
                No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">What about AI model costs?</h3>
              <p className="text-sm text-muted-foreground">
                PrompTek subscription covers platform access. AI model API costs are separate and billed
                by the respective providers (OpenAI, Anthropic, etc.) based on your usage. You'll need
                to add your own API keys in Settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">What's included in 8-pillar scoring?</h3>
              <p className="text-sm text-muted-foreground">
                Every optimization and test includes scoring across 8 quality dimensions: Clarity, 
                Specificity, Constraints, Elaboration, Efficiency, Structure, Intent Alignment, and 
                Adaptability. This is available on all plans.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}
