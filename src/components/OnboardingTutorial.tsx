import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTutorialProps {
  onComplete?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
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
      // Mark tutorial as completed
      await completeTutorial();
      setRun(false);
    }

    // Handle step changes
    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
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
          <h2 className="text-2xl font-bold">Welcome to PrompTek 👋</h2>
          <p className="text-muted-foreground">
            Let's walk you through the core features. You can skip, but we recommend following along for 60 seconds.
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
          <h3 className="font-bold text-lg">Lab 🧪</h3>
          <p className="text-sm">
            This is where you test your prompts and get graded across the 8-Pillar Framework.
          </p>
        </div>
      ),
      placement: 'right',
      spotlightClicks: true,
    },
    {
      target: '#optimizer-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Optimizer ⚡</h3>
          <p className="text-sm">
            Here you refine and improve your prompts automatically using AI-driven optimization.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#history-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">History 📚</h3>
          <p className="text-sm">
            All your optimized prompts and test results are saved here for later use.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#templates-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Templates 📋</h3>
          <p className="text-sm">
            Browse and use pre-made prompt templates to jumpstart your work.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#settings-tab',
      content: (
        <div className="space-y-2">
          <h3 className="font-bold text-lg">Settings ⚙️</h3>
          <p className="text-sm">
            Manage your account, API connections, and restart this tutorial anytime from here.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">You're ready to explore! 🎉</h2>
          <p className="text-muted-foreground">
            Start by testing your first prompt in the Lab.
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
