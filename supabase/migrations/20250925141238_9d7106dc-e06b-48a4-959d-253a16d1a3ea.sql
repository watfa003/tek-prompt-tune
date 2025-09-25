-- Create table for storing optimization findings and insights
CREATE TABLE public.optimization_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  batch_summary JSONB NOT NULL,
  successful_strategies JSONB NOT NULL,
  performance_patterns JSONB NOT NULL,
  optimization_rules JSONB NOT NULL,
  batch_count INTEGER NOT NULL DEFAULT 1,
  total_optimizations INTEGER NOT NULL DEFAULT 0,
  avg_improvement_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.optimization_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own optimization insights" 
ON public.optimization_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own optimization insights" 
ON public.optimization_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization insights" 
ON public.optimization_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_optimization_insights_updated_at
BEFORE UPDATE ON public.optimization_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for fast lookups
CREATE INDEX idx_optimization_insights_user_provider_model 
ON public.optimization_insights(user_id, ai_provider, model_name);

CREATE INDEX idx_optimization_insights_updated_at 
ON public.optimization_insights(updated_at DESC);