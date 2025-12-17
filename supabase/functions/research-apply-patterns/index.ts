import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatternConfig {
  trigger_phrases: { phrase: string; effectiveness: number; domains: string[] }[];
  inhibitor_phrases: string[];
  role_patterns: { pattern: string; effectiveness: number; domains: string[] }[];
  structure_recommendations: { pattern: string; effectiveness: number; domains: string[] }[];
  position_rules: { position: string; effectiveness: number }[];
}

async function getActivePatterns(supabase: any): Promise<PatternConfig> {
  const { data: patterns } = await supabase
    .from('extracted_patterns')
    .select('*')
    .eq('is_active', true)
    .gte('confidence', 0.5)
    .order('effectiveness_score', { ascending: false });
    
  if (!patterns?.length) {
    return {
      trigger_phrases: [],
      inhibitor_phrases: [],
      role_patterns: [],
      structure_recommendations: [],
      position_rules: [],
    };
  }
  
  return {
    trigger_phrases: patterns
      .filter(p => p.pattern_type === 'trigger' || p.pattern_type === 'amplifier')
      .map(p => ({
        phrase: p.pattern_value,
        effectiveness: p.effectiveness_score,
        domains: p.applicable_domains || [],
      })),
    inhibitor_phrases: patterns
      .filter(p => p.pattern_type === 'inhibitor')
      .map(p => p.pattern_value),
    role_patterns: patterns
      .filter(p => p.pattern_type === 'role')
      .map(p => ({
        pattern: p.pattern_value,
        effectiveness: p.effectiveness_score,
        domains: p.applicable_domains || [],
      })),
    structure_recommendations: patterns
      .filter(p => p.pattern_type === 'structure' && !p.pattern_value.startsWith('instruction_position'))
      .map(p => ({
        pattern: p.pattern_value,
        effectiveness: p.effectiveness_score,
        domains: p.applicable_domains || [],
      })),
    position_rules: patterns
      .filter(p => p.pattern_type === 'structure' && p.pattern_value.startsWith('instruction_position'))
      .map(p => ({
        position: p.pattern_value.replace('instruction_position:', ''),
        effectiveness: p.effectiveness_score,
      })),
  };
}

function detectDomain(prompt: string): string {
  const domainKeywords: Record<string, string[]> = {
    code: ['code', 'function', 'debug', 'program', 'api', 'database', 'sql', 'javascript', 'python'],
    creative: ['story', 'write', 'creative', 'poem', 'fiction', 'narrative', 'imagine'],
    education: ['explain', 'teach', 'learn', 'understand', 'concept', 'theory', 'how does'],
    business: ['email', 'professional', 'meeting', 'proposal', 'report', 'client'],
    marketing: ['product', 'marketing', 'advertisement', 'brand', 'campaign', 'customer'],
    analysis: ['analyze', 'compare', 'pros and cons', 'evaluate', 'assess', 'review'],
    health: ['health', 'medical', 'diet', 'exercise', 'nutrition', 'wellness'],
    technical: ['system', 'architecture', 'design', 'infrastructure', 'deploy', 'configure'],
  };
  
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return domain;
    }
  }
  
  return 'general';
}

function selectBestTrigger(
  triggers: PatternConfig['trigger_phrases'],
  domain: string
): string | null {
  // First try domain-specific triggers
  const domainTriggers = triggers.filter(t => 
    t.domains.length === 0 || t.domains.includes(domain)
  );
  
  if (domainTriggers.length > 0) {
    // Return the most effective one
    return domainTriggers[0].phrase;
  }
  
  // Fall back to most effective general trigger
  if (triggers.length > 0) {
    return triggers[0].phrase;
  }
  
  return null;
}

function selectBestRole(
  roles: PatternConfig['role_patterns'],
  domain: string
): string | null {
  // First try domain-specific roles
  const domainRoles = roles.filter(r => 
    r.domains.length === 0 || r.domains.includes(domain)
  );
  
  if (domainRoles.length > 0) {
    return domainRoles[0].pattern;
  }
  
  if (roles.length > 0) {
    return roles[0].pattern;
  }
  
  return null;
}

function removeInhibitors(prompt: string, inhibitors: string[]): string {
  let cleanedPrompt = prompt;
  
  for (const inhibitor of inhibitors) {
    // Case-insensitive removal
    const regex = new RegExp(inhibitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleanedPrompt = cleanedPrompt.replace(regex, '').trim();
  }
  
  // Clean up any double spaces
  return cleanedPrompt.replace(/\s+/g, ' ').trim();
}

function applyPositionRule(
  prompt: string,
  role: string,
  trigger: string,
  position: string
): string {
  switch (position) {
    case 'start':
      return `${trigger} ${role} ${prompt}`;
    case 'after_role':
      return `${role} ${trigger} ${prompt}`;
    case 'before_task':
      return `${role} ${trigger}\n\n${prompt}`;
    case 'end':
      return `${role} ${prompt} ${trigger}`;
    default:
      return `${role} ${trigger} ${prompt}`;
  }
}

async function applyPatterns(
  prompt: string,
  patterns: PatternConfig
): Promise<{ enhancedPrompt: string; appliedPatterns: string[] }> {
  const appliedPatterns: string[] = [];
  
  // Detect domain
  const domain = detectDomain(prompt);
  
  // Remove any inhibitor phrases first
  let enhancedPrompt = removeInhibitors(prompt, patterns.inhibitor_phrases);
  if (enhancedPrompt !== prompt) {
    appliedPatterns.push('Removed inhibitor phrases');
  }
  
  // Select best role
  const role = selectBestRole(patterns.role_patterns, domain);
  
  // Select best trigger phrase
  const trigger = selectBestTrigger(patterns.trigger_phrases, domain);
  
  // Get position rule (default to after_role)
  const position = patterns.position_rules[0]?.position || 'after_role';
  
  // Apply role and trigger with optimal positioning
  if (role || trigger) {
    enhancedPrompt = applyPositionRule(
      enhancedPrompt,
      role || '',
      trigger || '',
      position
    ).trim();
    
    if (role) appliedPatterns.push(`Added role: ${role}`);
    if (trigger) appliedPatterns.push(`Added trigger: ${trigger}`);
    appliedPatterns.push(`Position: ${position}`);
  }
  
  // Add structure recommendation if applicable
  const structureRec = patterns.structure_recommendations.find(s => 
    s.domains.length === 0 || s.domains.includes(domain)
  );
  
  if (structureRec && structureRec.effectiveness > 0.2) {
    // Only add structure hint if it's notably effective
    appliedPatterns.push(`Structure hint: ${structureRec.pattern}`);
  }
  
  return { enhancedPrompt, appliedPatterns };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, prompt } = await req.json();
    
    switch (action) {
      case 'apply': {
        if (!prompt) throw new Error('Prompt required');
        
        const patterns = await getActivePatterns(supabase);
        const { enhancedPrompt, appliedPatterns } = await applyPatterns(prompt, patterns);
        
        return new Response(JSON.stringify({ 
          success: true,
          original_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          applied_patterns: appliedPatterns,
          detected_domain: detectDomain(prompt),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'get_config': {
        const patterns = await getActivePatterns(supabase);
        
        return new Response(JSON.stringify({ 
          success: true,
          config: patterns,
          pattern_counts: {
            triggers: patterns.trigger_phrases.length,
            inhibitors: patterns.inhibitor_phrases.length,
            roles: patterns.role_patterns.length,
            structures: patterns.structure_recommendations.length,
            positions: patterns.position_rules.length,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'export_schema': {
        // Export patterns in a format that can be merged into optimization-schema.ts
        const patterns = await getActivePatterns(supabase);
        
        const schemaExtension = {
          data_driven_rules: {
            trigger_phrases: patterns.trigger_phrases.slice(0, 10),
            inhibitor_phrases: patterns.inhibitor_phrases,
            role_patterns: patterns.role_patterns.slice(0, 5),
            position_rule: patterns.position_rules[0]?.position || 'after_role',
            structure_patterns: patterns.structure_recommendations.slice(0, 5),
          },
          domain_specific: {
            code: {
              triggers: patterns.trigger_phrases
                .filter(t => t.domains.includes('code'))
                .map(t => t.phrase),
              roles: patterns.role_patterns
                .filter(r => r.domains.includes('code'))
                .map(r => r.pattern),
            },
            creative: {
              triggers: patterns.trigger_phrases
                .filter(t => t.domains.includes('creative'))
                .map(t => t.phrase),
              roles: patterns.role_patterns
                .filter(r => r.domains.includes('creative'))
                .map(r => r.pattern),
            },
            education: {
              triggers: patterns.trigger_phrases
                .filter(t => t.domains.includes('education'))
                .map(t => t.phrase),
              roles: patterns.role_patterns
                .filter(r => r.domains.includes('education'))
                .map(r => r.pattern),
            },
          },
        };
        
        return new Response(JSON.stringify({ 
          success: true,
          schema_extension: schemaExtension,
          usage: 'Merge this into PROMPTEK_JSON in optimization-schema.ts',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Pattern application error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
