-- Research Lab Tables for Data Collection

-- Experiments table to track research runs
CREATE TABLE public.research_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  experiment_type TEXT NOT NULL, -- 'tokenizer', 'behavioral', 'attention', 'cross_model'
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  total_tests INTEGER DEFAULT 0,
  completed_tests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Results from individual tests
CREATE TABLE public.research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.research_experiments(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL, -- 'trigger_phrase', 'role', 'structure', 'constraint', 'position'
  base_prompt TEXT NOT NULL,
  modified_prompt TEXT NOT NULL,
  modification_applied TEXT NOT NULL, -- what was changed
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL,
  output TEXT,
  base_score NUMERIC,
  modified_score NUMERIC,
  score_delta NUMERIC,
  category_scores JSONB, -- full 8-pillar breakdown
  latency_ms INTEGER,
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extracted patterns from analysis
CREATE TABLE public.extracted_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'trigger', 'inhibitor', 'amplifier', 'structure', 'role'
  pattern_value TEXT NOT NULL, -- the actual pattern/phrase
  effectiveness_score NUMERIC NOT NULL, -- average score improvement
  sample_size INTEGER NOT NULL, -- how many tests
  confidence NUMERIC, -- statistical confidence
  applicable_domains TEXT[], -- which task types it works for
  applicable_models TEXT[], -- which models it works for
  metadata JSONB DEFAULT '{}',
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_validated TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Token intelligence data
CREATE TABLE public.token_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_family TEXT NOT NULL, -- 'gpt', 'claude', 'llama', 'mistral'
  word TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  efficient_alternatives JSONB, -- array of {word, token_count, meaning_preserved}
  category TEXT, -- 'verb', 'noun', 'connector', 'instruction'
  power_score NUMERIC, -- effectiveness rating
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model_family, word)
);

-- Indexes for performance
CREATE INDEX idx_research_results_experiment ON public.research_results(experiment_id);
CREATE INDEX idx_research_results_test_type ON public.research_results(test_type);
CREATE INDEX idx_research_results_score_delta ON public.research_results(score_delta DESC);
CREATE INDEX idx_extracted_patterns_type ON public.extracted_patterns(pattern_type);
CREATE INDEX idx_extracted_patterns_effectiveness ON public.extracted_patterns(effectiveness_score DESC);
CREATE INDEX idx_token_intelligence_model ON public.token_intelligence(model_family);

-- Enable RLS
ALTER TABLE public.research_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_intelligence ENABLE ROW LEVEL SECURITY;

-- Admin-only policies using existing has_role function
CREATE POLICY "Admins can manage research experiments"
ON public.research_experiments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage research results"
ON public.research_results FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage extracted patterns"
ON public.extracted_patterns FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active patterns"
ON public.extracted_patterns FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage token intelligence"
ON public.token_intelligence FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view token intelligence"
ON public.token_intelligence FOR SELECT
USING (true);

-- Update trigger for experiments
CREATE TRIGGER update_research_experiments_updated_at
BEFORE UPDATE ON public.research_experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();