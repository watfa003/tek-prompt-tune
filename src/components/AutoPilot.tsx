import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Settings, Zap, Undo2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoPilotSettings {
  maxTokens: number;
  speed: 'fast' | 'normal' | 'deep';
  deepModeVariants: number;
  defaultLLM: string;
}

const DEFAULT_SETTINGS: AutoPilotSettings = {
  maxTokens: 2048,
  speed: 'normal',
  deepModeVariants: 3,
  defaultLLM: 'ChatGPT'
};

const LLM_OPTIONS = [
  { value: 'ChatGPT', label: 'ChatGPT (GPT-4/GPT-5)' },
  { value: 'Claude', label: 'Claude (Anthropic)' },
  { value: 'Gemini', label: 'Gemini (Google)' },
  { value: 'Mistral', label: 'Mistral AI' }
];

export const AutoPilot = () => {
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [selectedLLM, setSelectedLLM] = useState(DEFAULT_SETTINGS.defaultLLM);
  const [settings, setSettings] = useState<AutoPilotSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [credits, setCredits] = useState(100); // Mock credits for display
  const [copied, setCopied] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('autopilot_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: AutoPilotSettings) => {
    setSettings(newSettings);
    localStorage.setItem('autopilot_settings', JSON.stringify(newSettings));
    toast({
      title: "Settings saved",
      description: "Your AutoPilot preferences have been updated."
    });
  };

  // Optimize prompt using existing backend
  const optimizePrompt = async () => {
    if (!userPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to optimize.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    setOriginalPrompt(userPrompt);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call existing prompt-optimizer edge function
      const { data, error } = await supabase.functions.invoke('prompt-optimizer', {
        body: {
          prompt: userPrompt,
          aiProvider: selectedLLM,
          modelName: selectedLLM,
          outputType: 'text',
          variants: settings.speed === 'deep' ? settings.deepModeVariants : 1,
          temperature: settings.speed === 'fast' ? 0.3 : settings.speed === 'normal' ? 0.7 : 1.0,
          maxTokens: settings.maxTokens,
          taskDescription: `Optimize this prompt for ${selectedLLM}`
        }
      });

      if (error) throw error;

      if (data?.optimizedPrompt) {
        setOptimizedPrompt(data.optimizedPrompt);
        setCredits(prev => Math.max(0, prev - 1)); // Deduct 1 credit
        toast({
          title: "Prompt optimized!",
          description: `Applied ${settings.speed} mode optimization for ${selectedLLM}.`
        });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization failed",
        description: error instanceof Error ? error.message : "Failed to optimize prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply optimized prompt to input
  const applyOptimizedPrompt = () => {
    setUserPrompt(optimizedPrompt);
    toast({
      title: "Prompt applied",
      description: "The optimized prompt has replaced your original text."
    });
  };

  // Undo optimization
  const undoOptimization = () => {
    if (originalPrompt) {
      setUserPrompt(originalPrompt);
      setOptimizedPrompt('');
      toast({
        title: "Restored",
        description: "Original prompt has been restored."
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Header with credits */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AutoPilot Mode
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time prompt optimization for AI chatbots
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            {credits} Credits
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>AutoPilot Settings</CardTitle>
            <CardDescription>Configure your optimization preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([value]) => saveSettings({ ...settings, maxTokens: value })}
                  min={256}
                  max={4096}
                  step={256}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-20 text-right">{settings.maxTokens}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Optimization Speed</Label>
              <Select
                value={settings.speed}
                onValueChange={(value: 'fast' | 'normal' | 'deep') => 
                  saveSettings({ ...settings, speed: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">⚡ Fast - Quick optimization</SelectItem>
                  <SelectItem value="normal">🎯 Normal - Balanced quality</SelectItem>
                  <SelectItem value="deep">🧠 Deep - Maximum quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.speed === 'deep' && (
              <div className="space-y-2">
                <Label>Deep Mode Variants</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.deepModeVariants]}
                    onValueChange={([value]) => saveSettings({ ...settings, deepModeVariants: value })}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-20 text-right">{settings.deepModeVariants}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Default LLM</Label>
              <Select
                value={settings.defaultLLM}
                onValueChange={(value) => {
                  saveSettings({ ...settings, defaultLLM: value });
                  setSelectedLLM(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Optimization Interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Prompt</CardTitle>
            <CardDescription>Enter the prompt you want to optimize</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target AI Platform</Label>
              <Select value={selectedLLM} onValueChange={setSelectedLLM}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prompt Text</Label>
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[200px] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={optimizePrompt}
                disabled={isOptimizing || !userPrompt.trim()}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}
              </Button>
              {originalPrompt && (
                <Button
                  variant="outline"
                  onClick={undoOptimization}
                  disabled={isOptimizing}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>Optimized Prompt</CardTitle>
            <CardDescription>
              {optimizedPrompt ? 'Preview and apply your optimized prompt' : 'Optimized version will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {optimizedPrompt ? (
              <>
                <div className="space-y-2">
                  <Label>Optimized for {selectedLLM}</Label>
                  <Textarea
                    value={optimizedPrompt}
                    readOnly
                    className="min-h-[200px] resize-none bg-muted"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={applyOptimizedPrompt}
                    variant="secondary"
                    className="flex-1"
                  >
                    Apply to Input
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(optimizedPrompt)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    <strong>Strategy:</strong> {settings.speed.charAt(0).toUpperCase() + settings.speed.slice(1)} mode optimization
                  </p>
                </div>
              </>
            ) : (
              <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground text-center">
                  Enter a prompt and click "Optimize" to see results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use AutoPilot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Select your target AI platform (ChatGPT, Claude, Gemini, etc.)</li>
            <li>Enter or paste the prompt you want to optimize</li>
            <li>Click "Optimize Prompt" to generate an improved version</li>
            <li>Review the optimized prompt in the preview panel</li>
            <li>Click "Apply to Input" to replace your original prompt, or "Copy" to use elsewhere</li>
            <li>Use the optimized prompt in your chosen AI chatbot for better results</li>
          </ol>
          <Separator className="my-4" />
          <p className="text-xs">
            <strong>Note:</strong> Each optimization costs 1 credit. Adjust settings for speed vs. quality tradeoffs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
