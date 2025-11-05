import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTutorialProps {
  onComplete?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAndStartTutorial();
  }, []);

  const checkAndStartTutorial = async () => {
    // Check localStorage first for quick response
    const localComplete = localStorage.getItem('promptek_tutorial_completed');
    if (localComplete === 'true') {
      return;
    }

    // Check Supabase for logged-in users
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && (profile as any).tutorial_completed) {
        localStorage.setItem('promptek_tutorial_completed', 'true');
        return;
      }
    }

    // Start tutorial for new users
    setRun(true);
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type, lifecycle } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      await completeTutorial();
      setRun(false);
      return;
    }

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Navigate to correct page based on step
      if (nextStepIndex === 1) {
        // Going to Lab tab step
        navigate('/app/lab');
        setTimeout(() => setStepIndex(nextStepIndex), 300);
      } else if (nextStepIndex === 5) {
        // Going to Optimizer dashboard step
        navigate('/app');
        setTimeout(() => setStepIndex(nextStepIndex), 300);
      } else if (nextStepIndex === 11) {
        // Going to History tab step
        navigate('/app/history');
        setTimeout(() => setStepIndex(nextStepIndex), 300);
      } else if (nextStepIndex === 12) {
        // Going to Templates tab step
        navigate('/app/templates');
        setTimeout(() => setStepIndex(nextStepIndex), 300);
      } else if (nextStepIndex === 13) {
        // Going to Settings tab step
        navigate('/app/settings');
        setTimeout(() => setStepIndex(nextStepIndex), 300);
      } else {
        setStepIndex(nextStepIndex);
      }
    }
  };

  const completeTutorial = async () => {
    localStorage.setItem('promptek_tutorial_completed', 'true');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true } as any)
        .eq('id', user.id);
    }

    toast({
      title: "Tutorial completed! 🎉",
      description: "You're ready to start optimizing prompts.",
    });

    onComplete?.();
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to PrompTek 👋
          </h2>
          <p className="text-muted-foreground">
            Let's walk you through the core features in just 90 seconds. We'll show you how to optimize prompts, test them, and track your results.
          </p>
          <p className="text-sm text-primary">
            Press Next to begin your guided tour!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#lab-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">🧪 PromptTek Lab</h3>
          <p className="text-sm">
            This is your testing ground. The Lab evaluates your prompts using our <strong>8-Pillar Framework</strong>:
          </p>
          <ul className="text-xs space-y-1 ml-4 list-disc text-muted-foreground">
            <li>Clarity, Specificity, Context</li>
            <li>Structure, Examples, Constraints</li>
            <li>Tone, Adaptability</li>
          </ul>
          <p className="text-sm mt-2">
            Get instant scores and AI-powered feedback to improve your prompts.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Lab Features</h3>
          <p className="text-sm">The Lab has two modes:</p>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
              <strong className="text-primary">Single Test:</strong> Test one prompt and get detailed breakdown scores
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <strong className="text-accent">Battle Mode:</strong> Compare two prompts head-to-head to see which performs better
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Perfect for A/B testing and iterative improvements!
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Auto-Optimize Feature</h3>
          <p className="text-sm">
            After testing a prompt in the Lab, you can click <strong className="text-primary">"Auto-Optimize"</strong> to get AI-powered suggestions.
          </p>
          <p className="text-sm text-muted-foreground">
            The Lab will automatically re-test the optimized version and show you before/after comparisons with score improvements!
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#optimizer-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">⚡ AI Agent (Optimizer)</h3>
          <p className="text-sm">
            This is your main dashboard for <strong>generating optimized prompts</strong> from scratch.
          </p>
          <p className="text-sm text-muted-foreground">
            Unlike the Lab (which tests existing prompts), the Optimizer creates comprehensive, production-ready prompts from simple ideas.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: '.optimizer-task-input',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Task Description</h3>
          <p className="text-sm">
            Describe what you want the AI to do. Be as specific as possible!
          </p>
          <div className="p-2 bg-muted/50 rounded text-xs mt-2">
            <strong>Example:</strong> "Create a marketing email for a SaaS product launch"
          </div>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.optimizer-provider-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">AI Provider</h3>
          <p className="text-sm">
            Choose which AI company's models to use:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li><strong>OpenAI:</strong> GPT-5, GPT-4o (best for reasoning)</li>
            <li><strong>Anthropic:</strong> Claude models (creative & nuanced)</li>
            <li><strong>Google:</strong> Gemini (fast & cost-effective)</li>
            <li><strong>Groq:</strong> Ultra-fast inference</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.optimizer-model-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">LLM Model</h3>
          <p className="text-sm">
            Select the specific model version. Different models have different:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li><strong>Speed:</strong> Smaller models respond faster</li>
            <li><strong>Intelligence:</strong> Larger models reason better</li>
            <li><strong>Cost:</strong> Premium models cost more per request</li>
          </ul>
          <p className="text-xs text-primary mt-2">
            We recommend starting with GPT-4o-mini or Gemini Flash for best balance!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.optimizer-output-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Output Type</h3>
          <p className="text-sm">
            Tell us what format you want the AI to produce:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li><strong>Text:</strong> General writing, articles, responses</li>
            <li><strong>Code:</strong> Programming, scripts, technical</li>
            <li><strong>JSON:</strong> Structured data, APIs</li>
            <li><strong>List:</strong> Bullet points, action items</li>
            <li><strong>Essay:</strong> Long-form, academic writing</li>
          </ul>
          <p className="text-xs text-primary mt-2">
            This optimizes the prompt strategy for your specific use case!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.optimizer-variants-slider',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Variants</h3>
          <p className="text-sm">
            How many different prompt versions to generate (1-10).
          </p>
          <p className="text-xs text-muted-foreground">
            More variants = more options to choose from, but takes longer to process.
          </p>
          <p className="text-xs text-primary mt-2">
            💡 Tip: Start with 3-5 variants for best results!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '#history-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📚 History</h3>
          <p className="text-sm">
            Every optimized prompt and test result is automatically saved here.
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li>Search and filter past prompts</li>
            <li>Mark favorites with a star</li>
            <li>Reuse prompts as templates</li>
            <li>Track performance over time</li>
          </ul>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: '#templates-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📋 Templates</h3>
          <p className="text-sm">
            Browse pre-made prompt templates by category:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li>Marketing, Writing, Code, Analytics</li>
            <li>Business, Education, Support</li>
            <li>Create your own custom templates</li>
          </ul>
          <p className="text-xs text-primary mt-2">
            Use templates as starting points to save time!
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: '#settings-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">⚙️ Settings</h3>
          <p className="text-sm">
            Customize your PrompTek experience:
          </p>
          <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
            <li>Set default AI provider & model</li>
            <li>Configure notification preferences</li>
            <li>Manage data retention & privacy</li>
            <li>Restart this tutorial anytime</li>
          </ul>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: 'body',
      content: (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            You're ready to explore! 🎉
          </h2>
          <p className="text-muted-foreground">
            Start by creating your first optimized prompt in the AI Agent dashboard, or test an existing prompt in the Lab.
          </p>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-sm">
            <strong className="text-primary">Pro Tip:</strong> Use the Lab to perfect your prompts, then save the best ones as templates for future use!
          </div>
        </div>
      ),
      placement: 'center',
    },
  ];

  const styles: Partial<Styles> = {
    options: {
      arrowColor: 'hsl(var(--popover))',
      backgroundColor: 'hsl(var(--popover))',
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      primaryColor: 'hsl(var(--primary))',
      textColor: 'hsl(var(--popover-foreground))',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 60px hsl(var(--primary) / 0.2)',
      border: '1px solid hsl(var(--border))',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    buttonNext: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      transition: 'all 0.2s',
    },
    buttonBack: {
      color: 'hsl(var(--muted-foreground))',
      marginRight: '10px',
      padding: '10px 20px',
      borderRadius: '8px',
    },
    buttonSkip: {
      color: 'hsl(var(--muted-foreground))',
      padding: '10px 20px',
    },
    spotlight: {
      borderRadius: '8px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px hsl(var(--primary) / 0.4)',
    },
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={styles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip (Not Recommended)',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  );
};

export const restartTutorial = () => {
  localStorage.removeItem('promptek_tutorial_completed');
  window.location.reload();
};
