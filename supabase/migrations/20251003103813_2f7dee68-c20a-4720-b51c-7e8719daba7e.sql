-- Add missing column to speed_optimizations table
ALTER TABLE speed_optimizations 
ADD COLUMN IF NOT EXISTS processing_time_ms integer;

-- Create agent_logs table
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  agent_name text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  original_prompt text,
  optimized_prompt text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own agent logs"
  ON public.agent_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent logs"
  ON public.agent_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON public.agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON public.agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON public.agent_logs(created_at DESC);