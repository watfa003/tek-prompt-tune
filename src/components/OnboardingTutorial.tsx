import React, { useState, useEffect, useRef } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTutorialProps {
  onComplete?: () => void;
}

const TUTORIAL_STEPS = [
  // Step 0: Welcome
  {
    target: 'body',
    route: '/app',
    content: {
      step: 1,
      total: 18,
      title: 'Welcome to PrompTek! 👋',
      description: "Your AI prompt engineering powerhouse. Let's walk through every feature so you can master prompt optimization.",
    },
    placement: 'center' as const,
  },
  // Step 1: Lab Overview
  {
    target: '[data-tutorial="lab-main"]',
    route: '/app/lab',
    content: {
      step: 2,
      total: 18,
      section: 'Lab',
      title: '🧪 Welcome to the Lab',
      description: 'This is your prompt testing headquarters. Test individual prompts, compare two prompts head-to-head, or let AI auto-optimize your work.',
    },
    placement: 'bottom' as const,
  },
  // Step 2: Lab Tabs
  {
    target: '[data-tutorial="lab-tabs"]',
    route: '/app/lab',
    content: {
      step: 3,
      total: 18,
      section: 'Lab',
      title: 'Choose Your Test Mode',
      description: 'Single Test: Analyze one prompt deeply. Battle Mode: Pit two prompts against each other to find the winner. Each mode gives you detailed scores and insights.',
    },
    placement: 'bottom' as const,
  },
  // Step 3: Lab Prompt Input
  {
    target: '[data-tutorial="lab-prompt-input"]',
    route: '/app/lab',
    content: {
      step: 4,
      total: 18,
      section: 'Lab',
      title: 'Enter Your Prompt',
      description: 'Paste or type any prompt here. It can be simple ("Write a poem") or complex with instructions, context, and constraints. We\'ll score it across 8 quality dimensions.',
    },
    placement: 'bottom' as const,
  },
  // Step 4: Lab Model Selection
  {
    target: '[data-tutorial="lab-model-selection"]',
    route: '/app/lab',
    content: {
      step: 5,
      total: 18,
      section: 'Lab',
      title: 'Select AI Provider & Model',
      description: 'Choose which AI will execute your prompt. Each provider (OpenAI, Anthropic, Google, etc.) has different models with varying capabilities and speeds. Output Type tells the AI what format to produce (text, JSON, code, etc.).',
    },
    placement: 'bottom' as const,
  },
  // Step 5: Lab Test Button
  {
    target: '[data-tutorial="lab-test-button"]',
    route: '/app/lab',
    content: {
      step: 6,
      total: 18,
      section: 'Lab',
      title: 'Run Your Test',
      description: 'Click "Run Test & Score" to analyze your prompt. You\'ll get: a total score (0-10), breakdown across 8 pillars (Clarity, Specificity, Efficiency, etc.), strengths, weaknesses, and specific improvement suggestions.',
    },
    placement: 'top' as const,
  },
  // Step 6: Optimizer Overview
  {
    target: '[data-tutorial="optimizer-form"]',
    route: '/app/ai-agent',
    content: {
      step: 7,
      total: 18,
      section: 'Optimizer',
      title: '⚡ The AI Optimizer',
      description: 'This is where magic happens. Enter any prompt and our AI will generate multiple optimized versions using different strategies. Each variant is scored and the best one is automatically selected.',
    },
    placement: 'bottom' as const,
  },
  // Step 7: Original Prompt Input
  {
    target: '[data-tutorial="optimizer-form"]',
    route: '/app/ai-agent',
    content: {
      step: 8,
      total: 18,
      section: 'Optimizer',
      title: 'Your Original Prompt',
      description: 'Enter your existing prompt here - it can be rough, incomplete, or already decent. You can also add attachments (images, PDFs, documents) to give the optimizer more context about your task.',
    },
    placement: 'bottom' as const,
  },
  // Step 8: Provider/Model Selection
  {
    target: '[data-tutorial="optimizer-provider-select"]',
    route: '/app/ai-agent',
    content: {
      step: 9,
      total: 18,
      section: 'Optimizer',
      title: 'Choose Your AI',
      description: 'Select the AI provider and model that will optimize your prompt. GPT-4o and Claude 4 are great for complex prompts. Gemini Flash and Groq are faster for quick iterations.',
    },
    placement: 'bottom' as const,
  },
  // Step 9: Output Type
  {
    target: '[data-tutorial="optimizer-output-type"]',
    route: '/app/ai-agent',
    content: {
      step: 10,
      total: 18,
      section: 'Optimizer',
      title: 'Output Type Matters',
      description: 'Tell the optimizer what kind of output your prompt should produce: Text (general writing), JSON (structured data), Code (programming), Analysis (research), Creative (stories/art), or Lists. This helps create better-targeted optimizations.',
    },
    placement: 'bottom' as const,
  },
  // Step 10: Variants
  {
    target: '[data-tutorial="optimizer-variants"]',
    route: '/app/ai-agent',
    content: {
      step: 11,
      total: 18,
      section: 'Optimizer',
      title: 'Generate Multiple Versions',
      description: 'Choose how many prompt variants to generate (2-7). Each variant uses a different optimization strategy: some focus on clarity, others on specificity, structure, or efficiency. More variants = more options but longer processing.',
    },
    placement: 'bottom' as const,
  },
  // Step 11: Advanced Settings
  {
    target: '[data-tutorial="optimizer-advanced"]',
    route: '/app/ai-agent',
    content: {
      step: 12,
      total: 18,
      section: 'Optimizer',
      title: 'Advanced Settings',
      description: 'Expand this for power-user options: Speed Mode (fast, ~10s) vs Deep Mode (thorough, ~45s), temperature control, max tokens, and influence settings to blend your prompt with existing templates.',
    },
    placement: 'top' as const,
  },
  // Step 12: History
  {
    target: '[data-tutorial="history-list"]',
    route: '/app/history',
    content: {
      step: 13,
      total: 18,
      section: 'History',
      title: '📚 Your Prompt History',
      description: 'Every optimization is automatically saved here. Search by keywords, filter by score or date, star your favorites, and one-click copy any prompt. Use the menu to save prompts as reusable templates.',
    },
    placement: 'bottom' as const,
  },
  // Step 13: History Features
  {
    target: '[data-tutorial="history-list"]',
    route: '/app/history',
    content: {
      step: 14,
      total: 18,
      section: 'History',
      title: 'Work With Your History',
      description: 'Click any prompt to expand and see the full optimized version, scores, and AI response. Star prompts to mark favorites. Use "Re-optimize" to further improve any prompt, or "Use as Template" to save it for future use.',
    },
    placement: 'bottom' as const,
  },
  // Step 14: Templates
  {
    target: '[data-tutorial="templates-grid"]',
    route: '/app/templates',
    content: {
      step: 15,
      total: 18,
      section: 'Templates',
      title: '📋 Template Library',
      description: 'Browse professionally-crafted prompt templates organized by category: Writing, Business, Analytics, Code, Marketing, Education, and more. Each template is optimized and ready to use.',
    },
    placement: 'bottom' as const,
  },
  // Step 15: Using Templates
  {
    target: '[data-tutorial="templates-grid"]',
    route: '/app/templates',
    content: {
      step: 16,
      total: 18,
      section: 'Templates',
      title: 'Make Templates Work For You',
      description: 'Click any template to preview it, then "Use Template" to load it into the optimizer. You can also create your own templates from your best prompts, share them publicly, or keep them private.',
    },
    placement: 'bottom' as const,
  },
  // Step 16: Settings
  {
    target: '[data-tutorial="settings-panel"]',
    route: '/app/settings',
    content: {
      step: 17,
      total: 18,
      section: 'Settings',
      title: '⚙️ Customize Your Experience',
      description: 'Set your defaults: preferred AI provider/model, theme (light/dark), notification preferences, and performance options. Enable "Low Motion Mode" if animations feel heavy on your device.',
    },
    placement: 'bottom' as const,
  },
  // Step 17: Finish
  {
    target: 'body',
    route: '/app',
    content: {
      step: 18,
      total: 18,
      title: "You're Ready to Go! 🚀",
      description: 'Start by testing a prompt in the Lab, then optimize it to perfection. Your prompt engineering journey begins now!',
    },
    placement: 'center' as const,
  },
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const navigationInProgress = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    checkAndStartTutorial();
  }, []);

  const checkAndStartTutorial = async () => {
    // Check localStorage first
    const localComplete = localStorage.getItem('promptek_tutorial_completed');
    if (localComplete === 'true') {
      return;
    }

    // Check for saved progress
    const savedStep = localStorage.getItem('promptek_tutorial_step');
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step < TUTORIAL_STEPS.length) {
        setStepIndex(step);
      }
    }

    // Check database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tutorial_completed')
        .eq('user_id', user.id)
        .single();

      if (profile?.tutorial_completed) {
        localStorage.setItem('promptek_tutorial_completed', 'true');
        return;
      }
    }

    setRun(true);
  };

  // Wait for element with retry logic
  const waitForTutorialElement = async (
    selector: string,
    maxAttempts = 15,
    interval = 200
  ): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.height > 0 && rect.width > 0) {
          return true;
        }
      }
      await new Promise(r => setTimeout(r, interval));
    }
    return false;
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Save progress
    localStorage.setItem('promptek_tutorial_step', index.toString());

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      await completeTutorial();
      setRun(false);
      navigationInProgress.current = false;
      return;
    }

    // Handle TARGET_NOT_FOUND - skip to next step
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Tutorial target not found at step', index, '- skipping');
      retryCount.current++;
      
      // After 3 retries, skip to next step
      if (retryCount.current >= 3) {
        retryCount.current = 0;
        const nextStep = index + 1;
        if (nextStep < TUTORIAL_STEPS.length) {
          setRun(false);
          const nextRoute = TUTORIAL_STEPS[nextStep].route;
          navigate(nextRoute);
          await waitForTutorialElement(TUTORIAL_STEPS[nextStep].target);
          setStepIndex(nextStep);
          setTimeout(() => setRun(true), 300);
        }
      }
      return;
    }

    if (navigationInProgress.current) return;

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      retryCount.current = 0;
      const nextStepIndex = index + 1;
      
      if (nextStepIndex >= TUTORIAL_STEPS.length) {
        await completeTutorial();
        return;
      }

      const currentRoute = TUTORIAL_STEPS[index].route;
      const nextRoute = TUTORIAL_STEPS[nextStepIndex].route;

      // Navigate if needed
      if (nextRoute !== currentRoute) {
        navigationInProgress.current = true;
        setRun(false);
        navigate(nextRoute);
        
        const targetSelector = TUTORIAL_STEPS[nextStepIndex].target;
        await waitForTutorialElement(targetSelector);
        
        setStepIndex(nextStepIndex);
        setTimeout(() => {
          setRun(true);
          navigationInProgress.current = false;
        }, 300);
      } else {
        setStepIndex(nextStepIndex);
      }
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      retryCount.current = 0;
      const prevStepIndex = index - 1;
      if (prevStepIndex < 0) return;

      const currentRoute = TUTORIAL_STEPS[index].route;
      const prevRoute = TUTORIAL_STEPS[prevStepIndex].route;

      if (prevRoute !== currentRoute) {
        navigationInProgress.current = true;
        setRun(false);
        navigate(prevRoute);
        
        await waitForTutorialElement(TUTORIAL_STEPS[prevStepIndex].target);
        
        setStepIndex(prevStepIndex);
        setTimeout(() => {
          setRun(true);
          navigationInProgress.current = false;
        }, 300);
      } else {
        setStepIndex(prevStepIndex);
      }
    }
  };

  const completeTutorial = async () => {
    // Close popup immediately
    setRun(false);
    
    localStorage.setItem('promptek_tutorial_completed', 'true');
    localStorage.removeItem('promptek_tutorial_step');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true } as any)
        .eq('user_id', user.id);
    }

    toast({
      title: "Tutorial completed! 🎉",
      description: "You're ready to start optimizing prompts.",
    });

    onComplete?.();
  };

  // Convert config to Joyride steps
  const steps: Step[] = TUTORIAL_STEPS.map((step) => ({
    target: step.target,
    content: (
      <div className={step.placement === 'center' ? 'text-center space-y-3' : 'space-y-2'}>
        <div className="text-xs font-semibold text-primary mb-1">
          Step {step.content.step} of {step.content.total}
          {step.content.section && ` • ${step.content.section}`}
        </div>
        <h3 className={`font-bold ${step.placement === 'center' ? 'text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent' : 'text-lg'}`}>
          {step.content.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step.content.description}
        </p>
      </div>
    ),
    placement: step.placement,
    disableBeacon: true,
    spotlightClicks: false,
  }));

  const styles = {
    options: {
      arrowColor: 'hsl(var(--card))',
      backgroundColor: 'hsl(var(--card))',
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      primaryColor: 'hsl(var(--primary))',
      textColor: 'hsl(var(--foreground))',
      zIndex: 10000,
    },
    spotlight: {
      borderRadius: '12px',
      boxShadow: '0 0 0 4px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2)',
    },
    tooltip: {
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      border: '1px solid hsl(var(--border))',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    buttonNext: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '8px',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: 600,
    },
    buttonBack: {
      color: 'hsl(var(--muted-foreground))',
      marginRight: '8px',
    },
    buttonSkip: {
      color: 'hsl(var(--muted-foreground))',
    },
    buttonClose: {
      color: 'hsl(var(--muted-foreground))',
    },
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      spotlightPadding={8}
      callback={handleJoyrideCallback}
      styles={styles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tutorial',
      }}
    />
  );
};

export const restartTutorial = async () => {
  // Clear localStorage
  localStorage.removeItem('promptek_tutorial_completed');
  localStorage.removeItem('promptek_tutorial_step');
  
  // Reset database flag
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ tutorial_completed: false } as any)
      .eq('user_id', user.id);
  }
  
  // Reload to start fresh
  window.location.reload();
};
