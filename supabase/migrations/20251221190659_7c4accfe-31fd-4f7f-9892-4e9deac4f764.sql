-- Add user_feedback columns to prompt_analysis table
ALTER TABLE prompt_analysis 
ADD COLUMN IF NOT EXISTS user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP WITH TIME ZONE;

-- Create index for feedback queries
CREATE INDEX IF NOT EXISTS idx_prompt_analysis_user_feedback ON prompt_analysis(user_feedback) WHERE user_feedback IS NOT NULL;

-- Add RLS policy for users to update their own feedback
CREATE POLICY "Users can update feedback on their own analysis"
ON prompt_analysis
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);