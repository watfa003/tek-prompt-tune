-- Create table for speed mode optimization results with ratings
CREATE TABLE public.speed_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'speed',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'stars')),
  optimization_strategy TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speed_optimizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own speed optimizations" 
ON public.speed_optimizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own speed optimizations" 
ON public.speed_optimizations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own speed optimizations" 
ON public.speed_optimizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_speed_optimizations_updated_at
BEFORE UPDATE ON public.speed_optimizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();