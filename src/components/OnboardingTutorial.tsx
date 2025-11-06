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
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      await completeTutorial();
      setRun(false);
      return;
    }

    // Handle step navigation - only on STEP_AFTER to prevent double triggers
    if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Pre-navigate to correct page BEFORE showing the step
      if (nextStepIndex === 1) {
        // Navigate to Lab tab, then show step
        setRun(false);
        navigate('/app/lab');
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 800);
      } else if (nextStepIndex === 5) {
        // Navigate to Optimizer dashboard, then show step
        setRun(false);
        navigate('/app');
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 800);
      } else if (nextStepIndex === 11) {
        // Navigate to History tab, then show step
        setRun(false);
        navigate('/app/history');
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 800);
      } else if (nextStepIndex === 12) {
        // Navigate to Templates tab, then show step
        setRun(false);
        navigate('/app/templates');
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 800);
      } else if (nextStepIndex === 13) {
        // Navigate to Settings tab, then show step
        setRun(false);
        navigate('/app/settings');
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setRun(true);
        }, 800);
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
            Let's walk you through every feature in detail. This comprehensive tour takes about 2-3 minutes.
          </p>
          <p className="text-sm text-primary">
            You'll see each tab and learn exactly how to use every tool!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    // === LAB SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">🧪 Opening the Lab...</h3>
          <p className="text-sm text-muted-foreground">
            First, let's explore the testing environment where you evaluate prompt quality.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">🧪 PromptTek Lab Overview</h3>
          <p className="text-sm">
            The Lab is your <strong className="text-primary">prompt testing ground</strong>. Here you can:
          </p>
          <ul className="text-xs space-y-2 ml-4 list-disc">
            <li><strong>Test single prompts</strong> and get detailed scores across 8 quality pillars</li>
            <li><strong>Battle Mode:</strong> Compare two prompts head-to-head</li>
            <li><strong>Auto-Optimize:</strong> Get AI-powered improvements with before/after comparisons</li>
            <li><strong>Real-time feedback:</strong> See exactly what makes a prompt effective</li>
          </ul>
          <div className="mt-3 p-2 bg-primary/10 rounded text-xs">
            💡 The 8 Pillars: Clarity, Specificity, Context, Structure, Examples, Constraints, Tone, Adaptability
          </div>
        </div>
      ),
      placement: 'left',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Single Test Mode</h3>
          <p className="text-sm">
            In Single Test mode, paste any prompt and click <strong className="text-primary">"Analyze Prompt"</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            You'll get:
          </p>
          <ul className="text-xs space-y-1 ml-4 list-disc text-muted-foreground">
            <li>Overall quality score (0-100)</li>
            <li>Breakdown scores for each of the 8 pillars</li>
            <li>Specific improvement suggestions</li>
            <li>Optimized version recommendations</li>
          </ul>
        </div>
      ),
      placement: 'left',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Battle Mode</h3>
          <p className="text-sm">
            Battle Mode lets you <strong className="text-accent">A/B test two prompts</strong> side-by-side.
          </p>
          <div className="space-y-2 text-xs mt-2">
            <div className="p-2 bg-muted/50 rounded">
              <strong>Use Case:</strong> Testing different phrasings, comparing formal vs casual tone, or validating improvements
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>Result:</strong> See which prompt scores higher and why
            </div>
          </div>
        </div>
      ),
      placement: 'left',
    },
    // === OPTIMIZER SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">⚡ Opening AI Agent (Optimizer)...</h3>
          <p className="text-sm text-muted-foreground">
            Now let's see how to generate production-ready prompts from scratch.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.optimizer-task-input',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📝 Task Description</h3>
          <p className="text-sm">
            This is where you describe <strong>what you want the AI to do</strong>.
          </p>
          <div className="mt-2 space-y-2">
            <div className="p-2 bg-primary/10 rounded text-xs">
              <strong>Example:</strong> "Write a professional email to request a meeting with a potential client about our new SaaS product"
            </div>
            <div className="p-2 bg-muted/50 rounded text-xs">
              <strong>Tip:</strong> Be specific! Include context like audience, tone, and desired outcome.
            </div>
          </div>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.optimizer-provider-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">🏢 AI Provider Selection</h3>
          <p className="text-sm">
            Choose which company's AI models to use. Each has different strengths:
          </p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong className="text-primary">OpenAI:</strong> GPT-5, GPT-4o - Best for complex reasoning and technical tasks
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong className="text-accent">Anthropic:</strong> Claude 3.5 - Excellent for creative writing and nuanced understanding
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong className="text-blue-400">Google:</strong> Gemini - Fast, cost-effective, great for general tasks
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong className="text-orange-400">Groq:</strong> Ultra-fast inference for time-sensitive operations
            </div>
          </div>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.optimizer-model-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">🤖 LLM Model Version</h3>
          <p className="text-sm">
            Select the specific model version. Consider these trade-offs:
          </p>
          <ul className="text-xs space-y-2 ml-4 mt-2">
            <li>
              <strong className="text-primary">⚡ Speed:</strong> Smaller models (like GPT-4o-mini, Gemini Flash) respond in 1-3 seconds
            </li>
            <li>
              <strong className="text-accent">🧠 Intelligence:</strong> Larger models (GPT-5, Claude Opus) handle complex logic better
            </li>
            <li>
              <strong className="text-orange-400">💰 Cost:</strong> Premium models cost more per request
            </li>
          </ul>
          <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
            <strong>Recommendation:</strong> Start with GPT-4o-mini or Gemini Flash for the best balance of speed, quality, and cost!
          </div>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.optimizer-output-select',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📋 Output Type</h3>
          <p className="text-sm">
            Tell PrompTek what format you need. This optimizes the prompt strategy:
          </p>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong>Text:</strong> Articles, emails, general writing
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>Code:</strong> Programming, scripts, technical implementations
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>JSON:</strong> Structured data, API responses, databases
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>List:</strong> Bullet points, action items, summaries
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>Essay:</strong> Long-form content, academic writing, reports
            </div>
          </div>
          <p className="text-xs text-primary mt-2">
            Each type uses different prompting techniques for optimal results!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '.optimizer-variants-slider',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">🎲 Number of Variants</h3>
          <p className="text-sm">
            Generate 1-10 different prompt versions to choose from.
          </p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong>1-3 variants:</strong> Quick results, good for simple tasks (15-30 seconds)
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>4-7 variants:</strong> Balanced variety, recommended for most use cases (30-60 seconds)
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>8-10 variants:</strong> Maximum options, best for critical prompts (60-90 seconds)
            </div>
          </div>
          <p className="text-xs text-primary mt-2">
            💡 Tip: Start with 3-5 variants - you can always generate more later!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">How It Works</h3>
          <p className="text-sm">
            When you click <strong className="text-primary">"Generate Optimized Prompts"</strong>:
          </p>
          <ol className="text-xs space-y-2 ml-4 list-decimal">
            <li>PrompTek analyzes your task description and requirements</li>
            <li>Applies best practices from the 8-Pillar Framework</li>
            <li>Generates multiple prompt variants tailored to your output type</li>
            <li>Tests each variant for quality and effectiveness</li>
            <li>Ranks them by performance score</li>
          </ol>
          <div className="mt-3 p-2 bg-accent/10 rounded text-xs">
            <strong>Result:</strong> You get production-ready prompts you can use immediately in your AI workflows!
          </div>
        </div>
      ),
      placement: 'left',
    },
    // === HISTORY SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📚 Opening History...</h3>
          <p className="text-sm text-muted-foreground">
            Let's explore your prompt library and past results.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">📚 Prompt History</h3>
          <p className="text-sm">
            Every optimized prompt and test result is <strong className="text-primary">automatically saved here</strong>.
          </p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong>🔍 Search & Filter:</strong> Find prompts by keyword, date, or category
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>⭐ Favorites:</strong> Star your best prompts for quick access
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>♻️ Reuse:</strong> Click any prompt to use it as a template
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>📊 Analytics:</strong> Track performance trends over time
            </div>
          </div>
          <p className="text-xs text-primary mt-2">
            Build your personal prompt library and never lose a great prompt again!
          </p>
        </div>
      ),
      placement: 'left',
    },
    // === TEMPLATES SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">📋 Opening Templates...</h3>
          <p className="text-sm text-muted-foreground">
            Let's see the pre-made prompt templates library.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">📋 Prompt Templates Library</h3>
          <p className="text-sm">
            Browse <strong className="text-primary">professionally crafted templates</strong> organized by category:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong>✍️ Writing:</strong> Articles, blogs, copywriting
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>💼 Business:</strong> Emails, proposals, reports
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>📊 Analytics:</strong> Data analysis, insights
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>💻 Code:</strong> Programming, debugging, docs
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>📈 Marketing:</strong> Ads, social media, SEO
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>🎓 Education:</strong> Lessons, quizzes, training
            </div>
          </div>
          <div className="mt-3 p-2 bg-primary/10 rounded text-xs">
            <strong>Create Custom Templates:</strong> Save your best prompts as reusable templates!
          </div>
        </div>
      ),
      placement: 'left',
    },
    // === SETTINGS SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">⚙️ Opening Settings...</h3>
          <p className="text-sm text-muted-foreground">
            Finally, let's customize your PrompTek experience.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">⚙️ Settings & Preferences</h3>
          <p className="text-sm">
            Customize PrompTek to match your workflow:
          </p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="p-2 bg-muted/50 rounded">
              <strong>🤖 Default AI Settings:</strong> Set your preferred provider and model
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>🔔 Notifications:</strong> Configure email alerts and in-app notifications
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>🗄️ Data Management:</strong> Control retention periods and privacy settings
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>🎨 Theme:</strong> Switch between light and dark modes
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <strong>🧭 Tutorial:</strong> Restart this walkthrough anytime
            </div>
          </div>
        </div>
      ),
      placement: 'left',
    },
    // === FINISH ===
    {
      target: 'body',
      content: (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎉 You're All Set!
          </h2>
          <p className="text-muted-foreground">
            You now know how to use every major feature in PrompTek.
          </p>
          <div className="space-y-2 text-sm text-left">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <strong className="text-primary">Quick Start:</strong> Head to the AI Agent to generate your first optimized prompt!
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <strong className="text-accent">Pro Workflow:</strong> Use the Lab to test and perfect prompts, then save the best ones as templates.
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            You can restart this tutorial anytime from Settings → Restart Tutorial
          </p>
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
    },
    overlay: {
      mixBlendMode: 'normal',
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
        disableAnimation: true,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
      disableScrolling={true}
      disableScrollParentFix={true}
      spotlightClicks={false}
      disableOverlayClose={false}
    />
  );
};

export const restartTutorial = () => {
  localStorage.removeItem('promptek_tutorial_completed');
  window.location.reload();
};
