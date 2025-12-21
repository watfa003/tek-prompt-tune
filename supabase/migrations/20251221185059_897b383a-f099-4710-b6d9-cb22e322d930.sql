-- Create a dedicated table for storing logprob and behavioral analysis data
CREATE TABLE public.prompt_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  optimization_history_id UUID REFERENCES public.optimization_history(id) ON DELETE CASCADE,
  
  -- Optimization context
  strategy TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  
  -- Logprob analysis (when available from provider)
  perplexity NUMERIC,
  hallucination_risk NUMERIC,
  avg_confidence NUMERIC,
  low_confidence_tokens INTEGER,
  provider_supports_logprobs BOOLEAN DEFAULT false,
  
  -- Behavioral profile
  word_count INTEGER,
  sentence_count INTEGER,
  reasoning_depth INTEGER,
  formality_score NUMERIC,
  specificity_score NUMERIC,
  has_structure BOOLEAN DEFAULT false,
  has_examples BOOLEAN DEFAULT false,
  archetype TEXT, -- 'prose', 'list', 'code', 'mixed'
  
  -- Behavioral delta (compared to baseline)
  word_count_delta INTEGER,
  word_count_pct_change NUMERIC,
  reasoning_delta INTEGER,
  formality_shift NUMERIC,
  specificity_delta NUMERIC,
  perplexity_delta NUMERIC,
  hallucination_risk_delta NUMERIC,
  regression_detected BOOLEAN DEFAULT false,
  regression_categories TEXT[], -- e.g., ['reasoning_decreased', 'excessive_verbosity']
  
  -- Metadata
  score NUMERIC,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast user queries
CREATE INDEX idx_prompt_analysis_user_id ON public.prompt_analysis(user_id);
CREATE INDEX idx_prompt_analysis_created_at ON public.prompt_analysis(created_at DESC);
CREATE INDEX idx_prompt_analysis_provider_model ON public.prompt_analysis(ai_provider, model_name);
CREATE INDEX idx_prompt_analysis_regression ON public.prompt_analysis(regression_detected) WHERE regression_detected = true;

-- Enable Row Level Security
ALTER TABLE public.prompt_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own prompt analysis"
ON public.prompt_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompt analysis"
ON public.prompt_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow edge functions to insert via service role (no user_id check needed for service role)
CREATE POLICY "Service role can insert prompt analysis"
ON public.prompt_analysis
FOR INSERT
TO service_role
WITH CHECK (true);