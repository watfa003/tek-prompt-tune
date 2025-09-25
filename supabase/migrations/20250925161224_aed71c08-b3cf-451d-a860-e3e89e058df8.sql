-- Create speed_optimizations table that the edge function is trying to use
CREATE TABLE IF NOT EXISTS public.speed_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  strategy TEXT NOT NULL,
  score NUMERIC,
  generation_time_ms INTEGER,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  output_type TEXT,
  variants_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speed_optimizations ENABLE ROW LEVEL SECURITY;

-- Create policies for speed_optimizations
CREATE POLICY "Users can create their own speed optimizations" 
ON public.speed_optimizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own speed optimizations" 
ON public.speed_optimizations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create templates table for storing prompt templates
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  output_type TEXT DEFAULT 'text',
  rating INTEGER DEFAULT 5,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Users can create their own templates" 
ON public.prompt_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own templates and public templates" 
ON public.prompt_templates 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update their own templates" 
ON public.prompt_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.prompt_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for template timestamps
CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();