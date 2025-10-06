import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Copy, Check, Code, Zap, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutoPilotSettings {
  mode: 'fast' | 'normal' | 'deep';
  maxTokens: number;
  outputSpeed: 'normal' | 'fast';
}

const DEFAULT_SETTINGS: AutoPilotSettings = {
  mode: 'normal',
  maxTokens: 2048,
  outputSpeed: 'normal'
};

const AutoPilot = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutoPilotSettings>(DEFAULT_SETTINGS);
  const [userId, setUserId] = useState<string>('');
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Load settings and user info
  useEffect(() => {
    const loadData = async () => {
      const savedSettings = localStorage.getItem('autopilot_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setIsConnected(true);
        // Mock credits - in production this would come from Supabase
        setCredits(1000);
      }
    };
    loadData();
  }, []);

  const saveSettings = (newSettings: AutoPilotSettings) => {
    setSettings(newSettings);
    localStorage.setItem('autopilot_settings', JSON.stringify(newSettings));
  };

  const generateSnippet = () => {
    const SUPABASE_URL = "https://tnlthzzjtjvnaqafddnj.supabase.co";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA";
    
    const snippet = `
(async function() {
  const ENDPOINT = '${SUPABASE_URL}/functions/v1/prompt-optimizer';
  const USER_ID = '${userId}';
  const MODE = '${settings.mode}';
  const MAX_TOKENS = ${settings.maxTokens};
  
  // Find input field
  const input = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
  if (!input) return alert('❌ No input field found on this page');
  
  // Detect LLM from URL
  let llmType = 'ChatGPT';
  const url = window.location.hostname.toLowerCase();
  if (url.includes('claude')) llmType = 'Claude';
  else if (url.includes('gemini') || url.includes('google')) llmType = 'Gemini';
  else if (url.includes('mistral')) llmType = 'Mistral';
  
  // Create optimize button
  const existingBtn = document.getElementById('autopilot-btn');
  if (existingBtn) existingBtn.remove();
  
  const btn = document.createElement('button');
  btn.id = 'autopilot-btn';
  btn.innerHTML = '⚡ Optimize';
  btn.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
  \`;
  btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  document.body.appendChild(btn);
  
  btn.onclick = async () => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Optimizing...';
    btn.disabled = true;
    
    try {
      const prompt = input.value || input.innerText || input.textContent;
      if (!prompt.trim()) {
        alert('❌ Input field is empty');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
      }
      
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${ANON_KEY}',
          'apikey': '${ANON_KEY}'
        },
        body: JSON.stringify({
          prompt: prompt,
          aiProvider: llmType,
          modelName: llmType,
          outputType: 'text',
          variants: MODE === 'deep' ? 3 : 1,
          temperature: MODE === 'fast' ? 0.3 : MODE === 'normal' ? 0.7 : 1.0,
          maxTokens: MAX_TOKENS,
          taskDescription: \`Optimize this prompt for \${llmType}\`
        })
      });
      
      if (!res.ok) throw new Error('Optimization failed');
      
      const data = await res.json();
      if (data.optimizedPrompt) {
        if ('value' in input) input.value = data.optimizedPrompt;
        else if ('innerText' in input) input.innerText = data.optimizedPrompt;
        else if ('textContent' in input) input.textContent = data.optimizedPrompt;
        
        // Show success toast
        const toast = document.createElement('div');
        toast.innerHTML = '✅ Prompt optimized successfully!';
        toast.style.cssText = \`
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          z-index: 999999;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        \`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        alert('❌ No optimized prompt returned');
      }
    } catch (error) {
      alert('❌ Optimization failed: ' + error.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };
  
  // Show initial toast
  const toast = document.createElement('div');
  toast.innerHTML = '🚀 AutoPilot activated! Click "Optimize" when ready.';
  toast.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  \`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
})();
`.trim();
    
    return snippet;
  };

  const copySnippet = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to generate your snippet.",
        variant: "destructive"
      });
      return;
    }

    const snippet = generateSnippet();
    try {
      await navigator.clipboard.writeText(snippet);
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
      toast({
        title: "✨ Snippet copied!",
        description: "Paste it into any chatbot's browser console (F12) to activate AutoPilot."
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">AI Co-Pilot for Any Chatbot</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          AutoPilot
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Generate a JavaScript snippet that adds instant prompt optimization to any AI chatbot — no extension needed.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Wifi className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Connected</p>
                    <p className="text-sm text-muted-foreground">Backend API active</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-destructive/20">
                    <WifiOff className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold">Disconnected</p>
                    <p className="text-sm text-muted-foreground">Please sign in</p>
                  </div>
                </>
              )}
            </div>
            {credits !== null && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                {credits} credits
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Alert className="border-primary/30 bg-primary/5">
        <Code className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>How AutoPilot works:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Configure your optimization settings below</li>
            <li>Click "Generate Snippet" to create your personalized code</li>
            <li>Navigate to any AI chatbot (ChatGPT, Claude, Gemini, etc.)</li>
            <li>Open browser console (press F12)</li>
            <li>Paste the snippet and press Enter</li>
            <li>A floating "⚡ Optimize" button appears — click it to optimize any prompt!</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Settings</CardTitle>
          <CardDescription>Customize how AutoPilot optimizes your prompts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>Optimization Mode</Label>
            <Select
              value={settings.mode}
              onValueChange={(value: 'fast' | 'normal' | 'deep') => 
                saveSettings({ ...settings, mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">⚡ Speed Mode - Quick optimization (0.3s-1s)</SelectItem>
                <SelectItem value="normal">🎯 Normal Mode - Balanced quality (2s-4s)</SelectItem>
                <SelectItem value="deep">🧠 Deep Mode - Maximum quality (5s-10s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Max Tokens */}
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
            <p className="text-xs text-muted-foreground">
              Higher values allow longer optimized prompts
            </p>
          </div>

          <Separator />

          {/* Output Speed */}
          <div className="space-y-3">
            <Label>Response Speed</Label>
            <Select
              value={settings.outputSpeed}
              onValueChange={(value: 'normal' | 'fast') => 
                saveSettings({ ...settings, outputSpeed: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal - Standard processing</SelectItem>
                <SelectItem value="fast">Fast - Prioritize speed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Generate Snippet */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Your AutoPilot Snippet
          </CardTitle>
          <CardDescription>
            Copy this code and paste it into your browser console on any chatbot site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-border">
            <code className="text-muted-foreground">
              {userId ? '// Your personalized AutoPilot snippet is ready!' : '// Please sign in to generate your snippet'}
            </code>
          </div>

          <Button
            onClick={copySnippet}
            disabled={!isConnected || !userId}
            size="lg"
            className="w-full"
            variant={snippetCopied ? "secondary" : "default"}
          >
            {snippetCopied ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Copied! Now paste it into console (F12)
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                Generate & Copy Snippet
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            💡 Pro tip: Create a browser bookmark with this snippet for instant access on any site
          </p>
        </CardContent>
      </Card>

      {/* Supported Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['ChatGPT', 'Claude', 'Gemini', 'Mistral'].map(platform => (
              <div key={platform} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{platform}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            AutoPilot automatically detects which platform you're on and optimizes accordingly
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoPilot;
