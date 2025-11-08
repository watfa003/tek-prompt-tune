-- Create optimization_progress table for real-time progress tracking
CREATE TABLE IF NOT EXISTS public.optimization_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  step INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for fast lookups
CREATE INDEX idx_optimization_progress_session ON public.optimization_progress(session_key, user_id);

-- Enable RLS
ALTER TABLE public.optimization_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own progress"
  ON public.optimization_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.optimization_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.optimization_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_optimization_progress_updated_at
  BEFORE UPDATE ON public.optimization_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();