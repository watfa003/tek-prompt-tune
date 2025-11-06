import React, { useState, useEffect, useRef } from 'react';
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
  const navigationInProgress = useRef(false);

  useEffect(() => {
    checkAndStartTutorial();
  }, []);

  const checkAndStartTutorial = async () => {
    const localComplete = localStorage.getItem('promptek_tutorial_completed');
    if (localComplete === 'true') {
      return;
    }

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

    setRun(true);
  };

  // Helper function to wait for element to be present in DOM
  const waitForElement = (selector: string, timeout = 3000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      await completeTutorial();
      setRun(false);
      navigationInProgress.current = false;
      return;
    }

    // Handle TARGET_NOT_FOUND gracefully
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Tutorial target not found, continuing...');
      return;
    }

    // Prevent rapid clicking during navigation
    if (navigationInProgress.current) {
      return;
    }

    // Handle step navigation - only on STEP_AFTER to prevent double triggers
    if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Navigation logic
      if (nextStepIndex === 1) {
        navigationInProgress.current = true;
        setRun(false);
        navigate('/app/lab');
        setTimeout(async () => {
          await waitForElement('main, .lab-container', 2000);
          setStepIndex(nextStepIndex);
          setRun(true);
          navigationInProgress.current = false;
        }, 1200);
      } else if (nextStepIndex === 5) {
        navigationInProgress.current = true;
        setRun(false);
        navigate('/app');
        setTimeout(async () => {
          await waitForElement('textarea, .optimizer-container', 2000);
          setStepIndex(nextStepIndex);
          setRun(true);
          navigationInProgress.current = false;
        }, 1200);
      } else if (nextStepIndex === 11) {
        navigationInProgress.current = true;
        setRun(false);
        navigate('/app/history');
        setTimeout(async () => {
          await waitForElement('.history-container, main', 2000);
          setStepIndex(nextStepIndex);
          setRun(true);
          navigationInProgress.current = false;
        }, 1200);
      } else if (nextStepIndex === 12) {
        navigationInProgress.current = true;
        setRun(false);
        navigate('/app/templates');
        setTimeout(async () => {
          await waitForElement('.templates-container, main', 2000);
          setStepIndex(nextStepIndex);
          setRun(true);
          navigationInProgress.current = false;
        }, 1200);
      } else if (nextStepIndex === 13) {
        navigationInProgress.current = true;
        setRun(false);
        navigate('/app/settings');
        setTimeout(async () => {
          await waitForElement('.settings-container, main', 2000);
          setStepIndex(nextStepIndex);
          setRun(true);
          navigationInProgress.current = false;
        }, 1200);
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
          <div className="text-xs font-semibold text-primary mb-1">Step 1 of 16</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to PrompTek 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Let's walk you through every feature. This tour takes about 2-3 minutes.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      spotlightClicks: false,
    },
    // === LAB SECTION ===
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 2 of 16 • Lab</div>
          <h3 className="font-bold text-lg">🧪 PromptTek Lab</h3>
          <p className="text-sm">
            The Lab is your <strong className="text-primary">prompt testing ground</strong>. Here you can:
          </p>
          <ul className="text-xs space-y-1.5 ml-4 list-disc">
            <li><strong>Test single prompts</strong> with detailed scores</li>
            <li><strong>Battle Mode:</strong> Compare two prompts head-to-head</li>
            <li><strong>Auto-Optimize:</strong> Get AI improvements</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 3 of 16 • Lab</div>
          <h3 className="font-bold text-lg">Single Test Mode</h3>
          <p className="text-sm">
            Paste any prompt and click <strong className="text-primary">"Analyze Prompt"</strong>.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            You'll get overall scores, pillar breakdowns, and improvement suggestions.
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 4 of 16 • Lab</div>
          <h3 className="font-bold text-lg">Battle Mode</h3>
          <p className="text-sm">
            <strong className="text-accent">A/B test two prompts</strong> side-by-side to see which performs better.
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    // === OPTIMIZER SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-center">
          <div className="text-xs font-semibold text-primary mb-1">Step 5 of 16</div>
          <h3 className="font-bold text-lg">⚡ AI Agent (Optimizer)</h3>
          <p className="text-sm text-muted-foreground">
            Generate production-ready prompts from scratch.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      spotlightClicks: false,
    },
    {
      target: 'textarea',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 6 of 16 • Optimizer</div>
          <h3 className="font-bold text-lg">📝 Task Description</h3>
          <p className="text-sm">
            Describe <strong>what you want the AI to do</strong>.
          </p>
          <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
            <strong>Example:</strong> "Write a professional email to request a meeting about our SaaS product"
          </div>
        </div>
      ),
      placement: 'right',
      spotlightClicks: false,
    },
    {
      target: 'select, [role="combobox"]',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 7 of 16 • Optimizer</div>
          <h3 className="font-bold text-lg">🏢 AI Provider</h3>
          <p className="text-sm">
            Choose which company's AI models to use:
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="p-1.5 bg-muted/50 rounded">
              <strong className="text-primary">OpenAI:</strong> GPT models - Complex reasoning
            </div>
            <div className="p-1.5 bg-muted/50 rounded">
              <strong className="text-accent">Anthropic:</strong> Claude - Creative writing
            </div>
          </div>
        </div>
      ),
      placement: 'right',
      spotlightClicks: false,
    },
    {
      target: 'select, [role="combobox"]',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 8 of 16 • Optimizer</div>
          <h3 className="font-bold text-lg">🤖 Model Version</h3>
          <p className="text-sm">
            Select the specific model. Consider:
          </p>
          <ul className="text-xs space-y-1 ml-4 mt-2 list-disc">
            <li><strong className="text-primary">Speed:</strong> Smaller models = faster</li>
            <li><strong className="text-accent">Quality:</strong> Larger models = smarter</li>
          </ul>
        </div>
      ),
      placement: 'right',
      spotlightClicks: false,
    },
    {
      target: 'select, [role="combobox"]',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 9 of 16 • Optimizer</div>
          <h3 className="font-bold text-lg">📋 Output Type</h3>
          <p className="text-sm">
            Choose the format: Text, Code, JSON, List, or Essay.
          </p>
          <p className="text-xs text-primary mt-2">
            Each type uses different prompting techniques!
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: false,
    },
    {
      target: '[role="slider"], input[type="range"]',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 10 of 16 • Optimizer</div>
          <h3 className="font-bold text-lg">🎲 Variants</h3>
          <p className="text-sm">
            Generate 1-10 different prompt versions.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Start with 3-5 variants for the best balance!
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: false,
    },
    // === HISTORY SECTION ===
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-center">
          <div className="text-xs font-semibold text-primary mb-1">Step 11 of 16</div>
          <h3 className="font-bold text-lg">📚 History</h3>
          <p className="text-sm text-muted-foreground">
            Your prompt library and past results.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      spotlightClicks: false,
    },
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 12 of 16 • History</div>
          <h3 className="font-bold text-lg">📚 Prompt History</h3>
          <p className="text-sm">
            Every optimized prompt is <strong className="text-primary">automatically saved</strong> here.
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>🔍</span>
              <span>Search & filter prompts</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>Star favorites for quick access</span>
            </div>
            <div className="flex items-center gap-2">
              <span>♻️</span>
              <span>Reuse as templates</span>
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    // === TEMPLATES SECTION ===
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 13 of 16 • Templates</div>
          <h3 className="font-bold text-lg">📋 Templates Library</h3>
          <p className="text-sm">
            Browse <strong className="text-primary">professionally crafted templates</strong> by category.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Writing, Business, Analytics, Code, Marketing & more!
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    // === SETTINGS SECTION ===
    {
      target: 'main',
      content: (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary mb-1">Step 14 of 16 • Settings</div>
          <h3 className="font-bold text-lg">⚙️ Settings</h3>
          <p className="text-sm">
            Customize your PrompTek experience:
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>Profile settings</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎨</span>
              <span>Theme preferences</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span>Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>Privacy & security</span>
            </div>
          </div>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: false,
    },
    {
      target: 'body',
      content: (
        <div className="text-center space-y-3">
          <div className="text-xs font-semibold text-primary mb-1">Step 15 of 16</div>
          <h3 className="font-bold text-lg">💡 Pro Tips</h3>
          <ul className="text-sm space-y-2 text-left">
            <li>✨ Use favorites to build your prompt library</li>
            <li>🔄 Iterate on prompts in the Lab</li>
            <li>📊 Check history to track improvements</li>
            <li>⚡ Start with templates for quick results</li>
          </ul>
        </div>
      ),
      placement: 'center',
      spotlightClicks: false,
    },
    {
      target: 'body',
      content: (
        <div className="text-center space-y-3">
          <div className="text-xs font-semibold text-primary mb-1">Step 16 of 16</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            You're All Set! 🚀
          </h2>
          <p className="text-sm text-muted-foreground">
            Start creating amazing prompts with PrompTek!
          </p>
          <p className="text-xs text-primary mt-2">
            You can restart this tutorial anytime from Settings.
          </p>
        </div>
      ),
      placement: 'center',
      spotlightClicks: false,
    },
  ];

  const styles: Partial<Styles> = {
    options: {
      zIndex: 10000,
      primaryColor: 'hsl(var(--primary))',
      textColor: 'hsl(var(--foreground))',
      backgroundColor: 'hsl(var(--background))',
      arrowColor: 'hsl(var(--background))',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
    },
    tooltip: {
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid hsl(var(--border))',
      fontSize: '14px',
      maxWidth: '420px',
      animation: 'none',
      transition: 'none',
    },
    tooltipContainer: {
      textAlign: 'left',
      animation: 'none',
      transition: 'none',
    },
    tooltipContent: {
      animation: 'none',
      transition: 'none',
    },
    buttonNext: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'none',
      animation: 'none',
    },
    buttonBack: {
      color: 'hsl(var(--muted-foreground))',
      marginRight: '8px',
      fontSize: '14px',
      transition: 'none',
      animation: 'none',
    },
    buttonSkip: {
      color: 'hsl(var(--muted-foreground))',
      fontSize: '14px',
      transition: 'none',
      animation: 'none',
    },
    spotlight: {
      borderRadius: '8px',
      border: '2px solid hsl(var(--primary))',
      boxShadow: 'none',
      transition: 'none',
      animation: 'none',
    },
    overlay: {
      mixBlendMode: 'normal',
      transition: 'none',
      animation: 'none',
    },
    beacon: {
      animation: 'none',
      transition: 'none',
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
      callback={handleJoyrideCallback}
      styles={styles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip',
      }}
      floaterProps={{
        disableAnimation: true,
        disableFlip: false,
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
          floater: {
            transition: 'none',
            animation: 'none',
          },
        },
      }}
      disableScrolling={true}
      disableScrollParentFix={true}
      spotlightClicks={false}
      disableOverlayClose={false}
      spotlightPadding={4}
      scrollOffset={100}
      scrollDuration={0}
    />
  );
};

export const restartTutorial = () => {
  localStorage.removeItem('promptek_tutorial_completed');
  window.location.reload();
};
