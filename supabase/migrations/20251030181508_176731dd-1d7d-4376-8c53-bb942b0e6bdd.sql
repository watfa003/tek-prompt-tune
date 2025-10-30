-- Create table for Prompt Lab test results
CREATE TABLE public.prompt_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('single', 'compare')),
  target_llm TEXT NOT NULL,
  prompt_a TEXT NOT NULL,
  prompt_b TEXT,
  test_task TEXT,
  total_score_a NUMERIC,
  total_score_b NUMERIC,
  category_breakdown_a JSONB,
  category_breakdown_b JSONB,
  ai_analysis JSONB NOT NULL,
  winner TEXT,
  response_latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompt_lab_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lab results" 
ON public.prompt_lab_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lab results" 
ON public.prompt_lab_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lab results" 
ON public.prompt_lab_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_prompt_lab_results_user_id ON public.prompt_lab_results(user_id);
CREATE INDEX idx_prompt_lab_results_created_at ON public.prompt_lab_results(created_at DESC);