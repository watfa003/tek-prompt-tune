-- Add progress_id column to optimization_progress table for INSERT-based progress tracking
ALTER TABLE optimization_progress 
ADD COLUMN IF NOT EXISTS progress_id TEXT;

-- Create index on progress_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_optimization_progress_id 
ON optimization_progress(progress_id);

-- Create index on session_key and updated_at for efficient ordering
CREATE INDEX IF NOT EXISTS idx_optimization_progress_session_updated 
ON optimization_progress(session_key, updated_at DESC);