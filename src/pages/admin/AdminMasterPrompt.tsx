import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, History, CheckCircle, Clock, RefreshCw, Save, Eye, Code, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MasterPromptVersion {
  id: string;
  version: number;
  content: any;
  change_summary: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  activated_at: string | null;
  deactivated_at: string | null;
}

// Current production PrompTek schema - V5.3
const CURRENT_PROMPTEK_JSON = {
  id: "PrompTek_V5.3",
  mission: "Transform prompts to EXCEPTIONAL quality by inferring the optimal expert role dynamically while preserving exact user intent.",
  targets: { min: 9.0, avg: 9.2 },
  
  rules: {
    do: [
      "ALWAYS start optimized prompt with 'You are a [role]' - this is MANDATORY",
      "Preserve exact user intent",
      "Infer and construct the most suitable expert role based on content and task",
      "Express the role as a clear one-sentence persona",
      "ALL pillars ≥9.0",
      "Be AGGRESSIVE but precise",
      "When pillars conflict, prioritize: intent alignment + clarity first; never add constraints that increase hallucination risk"
    ],
    dont: [
      "Answer the prompt",
      "Change core request",
      "Use vague terms",
      "Score <9.0",
      "Omit the 'You are a [role]' opening",
      "Force predefined roles or labels",
      "Inject ideology or bias",
      "Invent facts or statistics",
      "Overconstrain when not justified"
    ]
  },

  model_context: {
    instruction: "Tailor the optimized prompt for the target model's preferred structure, clarity, and style.",
    note: "Adjust phrasing based on model capabilities when known",
    definition: "Tailoring means adjusting structure depth (flat vs framework), not changing intent or adding model-specific references."
  },

  role_synthesis: {
    instruction: "CRITICAL: Every optimized prompt MUST start with 'You are a [role]' where [role] is derived from task analysis. Analyze task type, domain knowledge required, audience, and depth to construct a precise role (e.g., 'You are a climate science educator explaining policy-relevant impacts to a general audience'). Never omit the role assignment.",
    constraints: [
      "ALWAYS start with 'You are a [role]'",
      "Role must be task-specific, not generic",
      "Role must match required expertise",
      "Role must justify authority without exaggeration"
    ],
    examples: [
      { task: "historical essay", role: "You are a historian specializing in the relevant period and region" },
      { task: "marketing copy", role: "You are a marketing strategist with brand and audience expertise" },
      { task: "code review", role: "You are a senior software engineer with language-specific expertise" },
      { task: "creative writing", role: "You are a creative writer with genre and style knowledge" },
      { task: "data analysis", role: "You are a data analyst with domain-specific context" },
      { task: "technical docs", role: "You are a technical writer with product expertise" },
      { task: "legal content", role: "You are a legal professional with jurisdiction awareness" }
    ]
  },

  structure_guidance: {
    critical: "DO NOT COPY ANY STRUCTURE EXACTLY. Every optimized prompt must have UNIQUE organization tailored to its specific task. The patterns below show ONE POSSIBLE approach - your output should look DIFFERENT.",
    principle: "Invent section names, headers, and organization that fit THIS prompt naturally. If a prompt is about cooking, use cooking-relevant sections. If about coding, use dev-relevant sections. NEVER use generic template headers.",
    examples_are_not_templates: [
      "These examples show possible flows, NOT formats to copy",
      "Your output should have DIFFERENT section names every time",
      "Simple tasks = no sections, just clear prose",
      "Complex tasks = custom sections that match the domain"
    ],
    possible_flows: [
      "Role → Objective → Method → Output (procedural tasks)",
      "Role → Context → Analysis → Deliverable (analytical tasks)",
      "Role → Brief → Creative Direction → Boundaries (creative tasks)",
      "Role → Task → Format (simple tasks - often enough)"
    ],
    mandatory_rules: [
      "NEVER reuse the same section headers across different prompts",
      "NEVER force structure on simple prompts - let them breathe",
      "ALWAYS invent domain-specific organization",
      "Section names must reflect the ACTUAL content, not generic labels"
    ]
  },

  pillars: {
    clarity:     { t: 9, d: "Zero ambiguity, explicit verbs, single interpretation", f: ["vague→precise", "passive→active", "break >20 words"] },
    specificity: { t: 9, d: "Concrete scope, parameters, and expectations", f: ["define scope", "require examples", "quantify where appropriate"] },
    efficiency:  { t: 9, d: "Max meaning/token, zero redundancy", f: ["eliminate filler", "compress phrases", "power verbs"] },
    structure:   { t: 9, d: "Clear logical flow from context to output", f: ["numbered steps", "section headers", "hierarchical bullets"] },
    constraints: { t: 9, d: "Explicit but intent-safe boundaries", f: ["define tone", "define format", "define exclusions only if needed"] },
    elaboration: { t: 9, d: "Adds background, audience, context without altering intent", f: ["add audience", "context", "2-3 examples"] },
    intent:      { t: 9, d: "TRUE goal explicit with measurable success criteria", f: ["success criteria", "measurable outcome", "clarify why"] },
    adaptability:{ t: 9, d: "Model-agnostic and context-robust", f: ["avoid model-specific phrasing", "handle uncertainty", "remain valid across LLMs"] }
  },

  length_policy: {
    default: "Do not enforce length unless user requests it or task inherently requires it",
    guidance: "If length is helpful, suggest a range instead of a fixed count",
    maxTokens_handling: "When META.maxTokens is specified, ADD an explicit instruction in the optimized prompt telling the AI to limit its response to approximately that token count. Example: 'Keep your response under [X] tokens.' or 'Limit output to approximately [X] tokens.' This ensures the end user's token budget is respected by the target model."
  },

  reliability_rules: {
    statistics: [
      "If precise statistics are requested, require authoritative sources",
      "If sources are not specified, instruct use of approximate ranges",
      "Never fabricate exact figures"
    ],
    citations: [
      "If the prompt requests sources/citations, require verifiable references (author + title + year) or hyperlinks when possible",
      "If the model cannot confidently cite, instruct it to provide a 'recommended sources to consult' list instead of inventing citations"
    ]
  },

  replace: {
    "good": "exceptional",
    "better": "more precise",
    "detailed": "include background context, key factors, and 2–3 concrete examples",
    "some": "3-5",
    "several": "3-5",
    "in order to": "to",
    "utilize": "use"
  },

  intensity: { light: 8.5, standard: 9.0, deep: 9.5 },

  output: {
    format: "<optimized_prompt>RESULT</optimized_prompt>",
    rules: ["Only return optimized prompt", "No commentary", "Preserve task type"]
  },

  self_refine: {
    instruction: "Critique the optimized prompt against all 8 pillars (clarity, specificity, efficiency, structure, constraints, elaboration, intent, adaptability). Identify the 1-3 weakest areas. Rewrite to address ONLY those weaknesses while preserving all strengths. Return the improved version.",
    focus: [
      "lowest scoring pillar",
      "vague or ambiguous language",
      "missing constraints or success criteria",
      "unclear deliverables or output format",
      "weak or missing role assignment"
    ],
    rules: [
      "NEVER remove existing strengths",
      "Focus on 1-3 targeted fixes, not wholesale rewrite",
      "If already exceptional (all pillars ≥9), return unchanged",
      "Preserve the exact role assignment ('You are a [role]')",
      "Maintain the same output type and structure",
      "Do not add unnecessary complexity"
    ],
    output_format: "<refined_prompt>RESULT</refined_prompt>"
  }
};

const AdminMasterPrompt: React.FC = () => {
  const [versions, setVersions] = useState<MasterPromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<MasterPromptVersion | null>(null);
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
        .from('master_prompt_versions')
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
      toast.error('Failed to load master prompt versions');
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

      let contentJson;
      try {
        contentJson = JSON.parse(newContent);
      } catch {
        contentJson = { prompt: newContent };
      }

      const { error } = await supabase
        .from('master_prompt_versions')
        .insert({
          version: nextVersion,
          content: contentJson,
          change_summary: changeSummary || null,
          created_by: user?.email || 'unknown',
          is_active: false
        });

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'create',
        entity_type: 'master_prompt_versions',
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

  const handleActivateVersion = async (version: MasterPromptVersion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('master_prompt_versions')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('is_active', true);

      const { error } = await supabase
        .from('master_prompt_versions')
        .update({ is_active: true, activated_at: new Date().toISOString() })
        .eq('id', version.id);

      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'update',
        entity_type: 'master_prompt_versions',
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
    setNewContent(JSON.stringify(CURRENT_PROMPTEK_JSON, null, 2));
    setChangeSummary('Based on PrompTek V5.3 - Dynamic Role Synthesis + Multi-Strategy Architecture');
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
          <h1 className="text-3xl font-bold text-foreground">Master Prompt Manager</h1>
          <p className="text-muted-foreground mt-1">Version control for the core optimization prompt</p>
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
            Current Schema
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Version History
          </TabsTrigger>
        </TabsList>

        {/* Current Schema Tab */}
        <TabsContent value="current" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PrompTek Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {CURRENT_PROMPTEK_JSON.id}
                </CardTitle>
                <CardDescription>{CURRENT_PROMPTEK_JSON.mission}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Min Target</p>
                    <p className="text-2xl font-bold text-foreground">{CURRENT_PROMPTEK_JSON.targets.min}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Avg Target</p>
                    <p className="text-2xl font-bold text-foreground">{CURRENT_PROMPTEK_JSON.targets.avg}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Pillars</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(CURRENT_PROMPTEK_JSON.pillars).map(([key, pillar]) => (
                      <div key={key} className="bg-muted/20 rounded-lg p-2 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground capitalize">{key}</span>
                          <Badge variant="outline" className="text-xs">t: {pillar.t}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pillar.d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Rules & Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-emerald-400 mb-2">DO</h4>
                  <div className="space-y-1">
                    {CURRENT_PROMPTEK_JSON.rules.do.map((rule, i) => (
                      <div key={i} className="text-xs text-muted-foreground bg-emerald-500/5 rounded px-2 py-1 border-l-2 border-emerald-500/30">
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2">DON'T</h4>
                  <div className="space-y-1">
                    {CURRENT_PROMPTEK_JSON.rules.dont.map((rule, i) => (
                      <div key={i} className="text-xs text-muted-foreground bg-red-500/5 rounded px-2 py-1 border-l-2 border-red-500/30">
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Schema JSON */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Full Schema (JSON)</CardTitle>
              <CardDescription>The complete PrompTek V5.3 configuration (strategies are in Strategy Definitions)</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
                {JSON.stringify(CURRENT_PROMPTEK_JSON, null, 2)}
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
                <CardTitle>Create New Version</CardTitle>
                <CardDescription>Add a new master prompt version (JSON or plain text)</CardDescription>
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
                  <label className="text-sm font-medium text-foreground mb-2 block">Content (JSON or text)</label>
                  <Textarea
                    placeholder='{"id": "PrompTek_V5.3", "mission": "...", ...}'
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
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                        <h4 className="text-sm font-medium text-foreground mb-1">Content</h4>
                        <pre className="text-xs font-mono bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
                          {JSON.stringify(selectedVersion.content, null, 2)}
                        </pre>
                      </div>
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

export default AdminMasterPrompt;
