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
      total: 10,
      title: 'Welcome to PrompTek 👋',
      description: "Let's walk you through every feature. This tour takes about 2 minutes.",
    },
    placement: 'center' as const,
  },
  // Step 1: Lab Overview
  {
    target: '[data-tutorial="lab-main"]',
    route: '/app/lab',
    content: {
      step: 2,
      total: 10,
      section: 'Lab',
      title: '🧪 PromptTek Lab',
      description: 'Your prompt testing ground. Test single prompts, compare two prompts head-to-head in Battle Mode, or use Auto-Optimize for AI improvements.',
    },
    placement: 'bottom' as const,
  },
  // Step 2: Lab Tabs
  {
    target: '[data-tutorial="lab-tabs"]',
    route: '/app/lab',
    content: {
      step: 3,
      total: 10,
      section: 'Lab',
      title: 'Test Modes',
      description: 'Switch between Single Test (analyze one prompt) and Battle Mode (compare two prompts).',
    },
    placement: 'bottom' as const,
  },
  // Step 3: Optimizer Overview
  {
    target: '[data-tutorial="optimizer-form"]',
    route: '/app',
    content: {
      step: 4,
      total: 10,
      section: 'Optimizer',
      title: '⚡ AI Optimizer',
      description: 'Generate production-ready prompts. Enter your task, select AI provider and model, then optimize!',
    },
    placement: 'right' as const,
  },
  // Step 4: Provider/Model Selection
  {
    target: '[data-tutorial="optimizer-provider-select"]',
    route: '/app',
    content: {
      step: 5,
      total: 10,
      section: 'Optimizer',
      title: 'Choose Your AI',
      description: 'Select from OpenAI, Anthropic, Google, Groq, or Mistral. Each provider offers different models optimized for various tasks.',
    },
    placement: 'right' as const,
  },
  // Step 5: Variants
  {
    target: '[data-tutorial="optimizer-variants"]',
    route: '/app',
    content: {
      step: 6,
      total: 10,
      section: 'Optimizer',
      title: '🎲 Generate Variants',
      description: 'Create 2-7 different prompt versions. Start with 3-5 variants for the best balance of options and speed.',
    },
    placement: 'right' as const,
  },
  // Step 6: History
  {
    target: '[data-tutorial="history-list"]',
    route: '/app/history',
    content: {
      step: 7,
      total: 10,
      section: 'History',
      title: '📚 Prompt History',
      description: 'Every optimized prompt is automatically saved. Search, filter, star favorites, and reuse as templates.',
    },
    placement: 'bottom' as const,
  },
  // Step 7: Templates
  {
    target: '[data-tutorial="templates-grid"]',
    route: '/app/templates',
    content: {
      step: 8,
      total: 10,
      section: 'Templates',
      title: '📋 Template Library',
      description: 'Browse professionally crafted templates by category: Writing, Business, Analytics, Code, Marketing & more!',
    },
    placement: 'bottom' as const,
  },
  // Step 8: Settings
  {
    target: '[data-tutorial="settings-panel"]',
    route: '/app/settings',
    content: {
      step: 9,
      total: 10,
      section: 'Settings',
      title: '⚙️ Settings',
      description: 'Customize your experience: profile, theme preferences, notifications, and default AI settings.',
    },
    placement: 'bottom' as const,
  },
  // Step 9: Finish
  {
    target: 'body',
    route: '/app',
    content: {
      step: 10,
      total: 10,
      title: "You're All Set! 🚀",
      description: 'Start optimizing prompts and unlock the full potential of AI. Happy prompting!',
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

export const restartTutorial = () => {
  localStorage.removeItem('promptek_tutorial_completed');
  localStorage.removeItem('promptek_tutorial_step');
  window.location.reload();
};
