import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Plus, History, CheckCircle, Clock, RefreshCw, Save, Eye, Code, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StrategyVersion {
  id: string;
  version: number;
  strategies: any;
  weights: any;
  hierarchy: any;
  change_summary: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  activated_at: string | null;
}

// Current production strategies - all 8 pillars
const CURRENT_STRATEGIES = {
  clarity: {
    name: "Cognitive Fusion Elite",
    focus: ["clarity", "structure", "intent"],
    targets: { clarity: 9, structure: 9, intent: 9 },
    w: 0.3,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Replace ALL vague words",
      "Explicit power verbs",
      "Passive→active",
      "Linear flow: context→task→method→output",
      "Single interpretation only"
    ],
    fix: "If clarity<9: eliminate ambiguity, explicit deliverables, convert passive, break complex sentences"
  },

  specificity: {
    name: "Precision Abstraction Elite",
    focus: ["specificity", "constraints", "clarity"],
    targets: { specificity: 9, constraints: 9, clarity: 9 },
    w: 0.25,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Quantify EVERYTHING",
      "Replace vague descriptors",
      "Exact numerical constraints",
      "Format schemas",
      "2-3 concrete examples"
    ],
    fix: "If specificity<9: quantify all (some→3-5), add format schema, include examples, measurable metrics"
  },

  efficiency: {
    name: "Semantic Compression",
    focus: ["efficiency", "specificity", "clarity"],
    targets: { efficiency: 7.8, specificity: 7.5, clarity: 7.5 },
    w: 0.2,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Active voice only",
      "Compress redundant phrases",
      "Eliminate filler words",
      "Dense meaning"
    ],
    fix: "If efficiency<7.8: convert passive→active, remove filler, consolidate, power verbs"
  },

  structure: {
    name: "Directive Synthesis",
    focus: ["structure", "clarity", "constraints"],
    targets: { structure: 7.8, clarity: 7.5, constraints: 7.5 },
    w: 0.15,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Context→Task→Method→Constraints→Output",
      "Numbered steps",
      "Section headers",
      "Hierarchical bullets",
      "Explicit dependencies"
    ],
    fix: "If structure<7.8: add numbered steps, section headers, hierarchical bullets, state order"
  },

  constraints: {
    name: "Constraint-Driven Creativity Elite",
    focus: ["constraints", "elaboration", "specificity"],
    targets: { constraints: 9, elaboration: 9, specificity: 9 },
    w: 0.1,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Intent-safe boundaries only",
      "Precise length ranges (not fixed counts)",
      "Explicit tone",
      "Style rules",
      "Exclusions only when justified"
    ],
    fix: "If constraints<9: format schema, length ranges, explicit tone, justify exclusions, quality criteria"
  },

  elaboration: {
    name: "Contextual Intelligence Matrix",
    focus: ["elaboration", "intent", "adaptability"],
    targets: { elaboration: 8.6, intent: 8.5, adaptability: 8.5 },
    w: 0.12,
    cond: { type: "length", op: "<", val: 200 },
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Audience awareness",
      "Use-case context",
      "Relevant background",
      "1-2 examples",
      "Statistics require authoritative sources or ranges",
      "For analytical essays, require thesis + causal drivers + competing perspectives + implications"
    ],
    fix: "If elaboration<8.6: specify audience, add context, provide examples, include background"
  },

  intent: {
    name: "Semantic Anchoring Elite",
    focus: ["intent", "specificity", "clarity"],
    targets: { intent: 9, specificity: 8.5, clarity: 8.5 },
    w: 0.12,
    cond: { type: "regex", pattern: "\\b(improve|better|fix|enhance|optimize|analyze|make)\\b" },
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Identify TRUE goal",
      "Explicit success criteria",
      "Define outcome precisely",
      "Preserve exact verb",
      "Never fabricate statistics"
    ],
    fix: "If intent<9: add success criteria, define outcome, state primary goal, anchor terms"
  },

  adaptability: {
    name: "Cognitive Elasticity",
    focus: ["adaptability", "intent", "clarity"],
    targets: { adaptability: 8.6, intent: 8.5, clarity: 8.5 },
    w: 0.08,
    apply: [
      "Dynamic role synthesis based on task analysis",
      "Model-agnostic language",
      "Conditional phrasing",
      "Fallback options",
      "Handle variations",
      "Avoid LLM-specific phrasing"
    ],
    fix: "If adaptability<8.6: add if/when clauses, fallbacks, avoid model-specific terms"
  }
};

const STRATEGY_COLORS: Record<string, string> = {
  clarity: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  specificity: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  efficiency: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  structure: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  constraints: 'bg-red-500/10 text-red-400 border-red-500/30',
  elaboration: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  intent: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  adaptability: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

const AdminStrategyDefinitions: React.FC = () => {
  const [versions, setVersions] = useState<StrategyVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<StrategyVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('strategy_definitions_versions')
        .select('*')
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
      
      const activeVersion = data?.find(v => v.is_active);
      if (activeVersion) {
        setSelectedVersion(activeVersion);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load strategy versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newContent.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

      let parsed;
      try {
        parsed = JSON.parse(newContent);
      } catch {
        toast.error('Invalid JSON format');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('strategy_definitions_versions')
        .insert({
          version: nextVersion,
          strategies: parsed.strategies || parsed,
          weights: parsed.weights || {},
          hierarchy: parsed.hierarchy || {},
          change_summary: changeSummary || null,
          created_by: user?.email || 'unknown',
          is_active: false
        });

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'create',
        entity_type: 'strategy_definitions_versions',
        actor_email: user?.email || 'unknown',
        metadata: { version: nextVersion }
      });

      toast.success(`Version ${nextVersion} created successfully`);
      setNewContent('');
      setChangeSummary('');
      setShowCreateForm(false);
      loadVersions();
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Failed to create new version');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (version: StrategyVersion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('strategy_definitions_versions')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('is_active', true);

      const { error } = await supabase
        .from('strategy_definitions_versions')
        .update({ is_active: true, activated_at: new Date().toISOString() })
        .eq('id', version.id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'update',
        entity_type: 'strategy_definitions_versions',
        entity_id: version.id,
        actor_email: user?.email || 'unknown',
        metadata: { action: 'activate', version: version.version }
      });

      toast.success(`Version ${version.version} activated`);
      loadVersions();
    } catch (error) {
      console.error('Error activating version:', error);
      toast.error('Failed to activate version');
    }
  };

  const handleLoadCurrentAsNew = () => {
    const weights: Record<string, number> = {};
    Object.entries(CURRENT_STRATEGIES).forEach(([key, strategy]) => {
      weights[key] = strategy.w;
    });

    setNewContent(JSON.stringify({ strategies: CURRENT_STRATEGIES, weights }, null, 2));
    setChangeSummary('Based on current production strategies - all 8 pillars');
    setShowCreateForm(true);
    setActiveTab('versions');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-muted rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Definitions</h1>
          <p className="text-muted-foreground mt-1">Version control for optimization strategies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLoadCurrentAsNew}>
            <Code className="w-4 h-4 mr-2" />
            Save Current as Version
          </Button>
          <Button onClick={() => { setShowCreateForm(!showCreateForm); setActiveTab('versions'); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Current Strategies
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Version History
          </TabsTrigger>
        </TabsList>

        {/* Current Strategies Tab */}
        <TabsContent value="current" className="space-y-6">
          {/* Strategy Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Strategies</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(CURRENT_STRATEGIES).length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(CURRENT_STRATEGIES).reduce((sum, s) => sum + s.w, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Conditional</p>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(CURRENT_STRATEGIES).filter((s: any) => s.cond).length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Avg Target</p>
                <p className="text-2xl font-bold text-foreground">8.7</p>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(CURRENT_STRATEGIES).map(([key, strategy]) => (
              <Card key={key} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={STRATEGY_COLORS[key]}>
                      {key.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Weight: {strategy.w}</span>
                  </div>
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-1">
                    Focus: {strategy.focus.map(f => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Targets</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(strategy.targets).map(([t, v]) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}: {v}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {'cond' in strategy && strategy.cond && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Condition</h4>
                      <code className="text-xs bg-muted/50 rounded px-2 py-1 text-muted-foreground">
                        {JSON.stringify(strategy.cond)}
                      </code>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Apply Steps</h4>
                    <div className="space-y-1">
                      {strategy.apply.map((step, i) => (
                        <div key={i} className="text-xs text-muted-foreground bg-muted/20 rounded px-2 py-1">
                          {i + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Fix Rule</h4>
                    <p className="text-xs text-muted-foreground bg-yellow-500/10 rounded px-2 py-1 border-l-2 border-yellow-500/30">
                      {strategy.fix}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full JSON */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Full Strategies (JSON)</CardTitle>
              <CardDescription>Complete strategy definitions for all 8 pillars</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
                {JSON.stringify(CURRENT_STRATEGIES, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="versions" className="space-y-6">
          {/* Create Form */}
          {showCreateForm && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Create New Strategy Version</CardTitle>
                <CardDescription>Define strategies, weights, and hierarchy in JSON format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Change Summary</label>
                  <Textarea
                    placeholder="Describe what changed in this version..."
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Strategies JSON</label>
                  <Textarea
                    placeholder='{ "strategies": {...}, "weights": {...}, "hierarchy": {...} }'
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateVersion} disabled={saving}>
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Version
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version List & Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Version List */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No versions saved yet</p>
                    <p className="text-xs mt-2">Use "Save Current as Version" to create your first snapshot</p>
                  </div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedVersion?.id === version.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-muted/30 border-border hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">v{version.version}</span>
                        {version.is_active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {version.change_summary && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {version.change_summary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Version Detail */}
            <div className="lg:col-span-2">
              <Card className="bg-card border-border h-full">
                {selectedVersion ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Version {selectedVersion.version}</CardTitle>
                          <CardDescription>
                            Created by {selectedVersion.created_by} on {format(new Date(selectedVersion.created_at), 'MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                        {!selectedVersion.is_active && (
                          <Button onClick={() => handleActivateVersion(selectedVersion)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedVersion.change_summary && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Change Summary</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            {selectedVersion.change_summary}
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Strategies</h4>
                        <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-48">
                          {JSON.stringify(selectedVersion.strategies, null, 2)}
                        </pre>
                      </div>
                      {selectedVersion.weights && Object.keys(selectedVersion.weights).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Weights</h4>
                          <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-32">
                            {JSON.stringify(selectedVersion.weights, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedVersion.hierarchy && Object.keys(selectedVersion.hierarchy).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Hierarchy</h4>
                          <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-32">
                            {JSON.stringify(selectedVersion.hierarchy, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a version to view details</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStrategyDefinitions;
