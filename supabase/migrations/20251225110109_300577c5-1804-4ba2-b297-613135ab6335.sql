-- Add individual_changes and post_implementation_metrics to weekly_change_requests
ALTER TABLE public.weekly_change_requests 
ADD COLUMN IF NOT EXISTS individual_changes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS post_implementation_metrics JSONB;

-- Add change_request_id to prompt_analysis for impact tracking
ALTER TABLE public.prompt_analysis 
ADD COLUMN IF NOT EXISTS change_request_id UUID REFERENCES public.weekly_change_requests(id);

-- Create index for efficient impact measurement queries
CREATE INDEX IF NOT EXISTS idx_prompt_analysis_change_request 
ON public.prompt_analysis(change_request_id) 
WHERE change_request_id IS NOT NULL;