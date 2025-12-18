-- Create wording_patterns table for DSPy-style wording optimization
CREATE TABLE public.wording_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_phrase TEXT NOT NULL,
  winning_phrase TEXT NOT NULL,
  avg_score_improvement NUMERIC DEFAULT 0,
  test_count INTEGER DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  applicable_domains TEXT[] DEFAULT '{}',
  applicable_models TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_tested TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create unique constraint on original_phrase + winning_phrase combo
CREATE UNIQUE INDEX idx_wording_patterns_unique ON public.wording_patterns(original_phrase, winning_phrase);

-- Create index for quick lookups of active high-confidence patterns
CREATE INDEX idx_wording_patterns_active ON public.wording_patterns(is_active, confidence DESC) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.wording_patterns ENABLE ROW LEVEL SECURITY;

-- Admins can manage all patterns
CREATE POLICY "Admins can manage wording patterns"
ON public.wording_patterns
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active patterns (they're used by the optimizer)
CREATE POLICY "Anyone can view active wording patterns"
ON public.wording_patterns
FOR SELECT
USING (is_active = true);