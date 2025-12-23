-- Add feedback_reason column to prompt_analysis
ALTER TABLE public.prompt_analysis 
ADD COLUMN IF NOT EXISTS feedback_reason TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.prompt_analysis.feedback_reason IS 'Optional user-provided reason for negative feedback';

-- Create index for analyzing feedback patterns
CREATE INDEX IF NOT EXISTS idx_prompt_analysis_feedback_reason 
ON public.prompt_analysis (user_feedback) 
WHERE user_feedback IS NOT NULL;