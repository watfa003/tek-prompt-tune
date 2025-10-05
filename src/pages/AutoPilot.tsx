import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Settings2, Zap, Copy, Check, RotateCcw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  { value: 'ChatGPT', label: 'ChatGPT', url: 'https://chat.openai.com' },
  { value: 'Claude', label: 'Claude', url: 'https://claude.ai' },
  { value: 'Gemini', label: 'Gemini', url: 'https://gemini.google.com' },
  { value: 'Mistral', label: 'Mistral', url: 'https://chat.mistral.ai' }
];

const AutoPilot = () => {
  const { toast } = useToast();
  const [userPrompt, setUserPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [selectedLLM, setSelectedLLM] = useState(DEFAULT_SETTINGS.defaultLLM);
  const [settings, setSettings] = useState<AutoPilotSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('autopilot_settings');
    if (savedSettings) {
      const loaded = JSON.parse(savedSettings);
      setSettings(loaded);
      setSelectedLLM(loaded.defaultLLM);
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
        toast({
          title: "✨ Prompt optimized!",
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

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "📋 Copied!",
        description: "Paste this into your AI chatbot."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  // Clear and reset
  const clearAll = () => {
    setUserPrompt('');
    setOptimizedPrompt('');
    setCopied(false);
  };

  const selectedLLMUrl = LLM_OPTIONS.find(opt => opt.value === selectedLLM)?.url;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          AutoPilot
        </h1>
        <p className="text-muted-foreground text-lg">
          Optimize prompts before pasting into ChatGPT, Claude, or Gemini
        </p>
      </div>

      {/* How to Use Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            How to Use AutoPilot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">1</Badge>
              <p>Select your target AI platform below (ChatGPT, Claude, Gemini, etc.)</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">2</Badge>
              <p>Type or paste your prompt in the input box</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">3</Badge>
              <p>Click "Optimize Prompt" to generate an improved version</p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">4</Badge>
              <p>Copy the optimized prompt and paste it into your AI chatbot</p>
            </div>
          </div>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">
            💡 <strong>Pro tip:</strong> Open your AI chatbot in a split screen or separate window for seamless copy-paste workflow
          </p>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <div className="grid gap-6">
        {/* Target Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target AI Platform</CardTitle>
            <CardDescription>Choose which AI chatbot you'll use this prompt with</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
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
              {selectedLLMUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedLLMUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {selectedLLM}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Prompt</CardTitle>
            <CardDescription>Enter the prompt you want to optimize</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Type your prompt here..."
              className="min-h-[150px] resize-y text-base"
            />

            <div className="flex gap-2">
              <Button
                onClick={optimizePrompt}
                disabled={isOptimizing || !userPrompt.trim()}
                className="flex-1"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Prompt'}
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={isOptimizing}
                size="lg"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        {optimizedPrompt && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>✨ Optimized Prompt</span>
                <Badge variant="secondary">
                  {settings.speed.charAt(0).toUpperCase() + settings.speed.slice(1)} Mode
                </Badge>
              </CardTitle>
              <CardDescription>
                Ready to paste into {selectedLLM}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={optimizedPrompt}
                readOnly
                className="min-h-[150px] resize-y bg-background/50 text-base font-medium"
              />

              <Button
                onClick={() => copyToClipboard(optimizedPrompt)}
                size="lg"
                className="w-full"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied! Now paste into {selectedLLM}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Optimized Prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Settings Panel */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Advanced Settings
                  </CardTitle>
                  <Badge variant="outline">
                    {showSettings ? 'Hide' : 'Show'}
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                <div className="space-y-3">
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
                      <SelectItem value="fast">⚡ Fast - Quick optimization (0.3s-1s)</SelectItem>
                      <SelectItem value="normal">🎯 Normal - Balanced quality (2s-4s)</SelectItem>
                      <SelectItem value="deep">🧠 Deep - Maximum quality (5s-10s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.speed === 'deep' && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Deep Mode Variants</Label>
                      <span className="text-sm font-medium">{settings.deepModeVariants}</span>
                    </div>
                    <Slider
                      value={[settings.deepModeVariants]}
                      onValueChange={([value]) => saveSettings({ ...settings, deepModeVariants: value })}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      More variants = better quality but slower optimization
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm font-medium">{settings.maxTokens}</span>
                  </div>
                  <Slider
                    value={[settings.maxTokens]}
                    onValueChange={([value]) => saveSettings({ ...settings, maxTokens: value })}
                    min={256}
                    max={4096}
                    step={256}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Default Platform</Label>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};

export default AutoPilot;
