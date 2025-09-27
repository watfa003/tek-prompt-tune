-- One-time sync of existing prompts to optimization_history
INSERT INTO optimization_history (
  user_id,
  prompt_id, 
  variant_prompt,
  ai_response,
  score,
  generation_time_ms,
  tokens_used,
  metrics,
  created_at
)
SELECT 
  user_id,
  id as prompt_id,
  COALESCE(optimized_prompt, original_prompt) as variant_prompt,
  '' as ai_response, -- Set empty string since we don't have AI responses stored
  score,
  CASE 
    WHEN performance_metrics ? 'processing_time_ms' 
    THEN (performance_metrics->>'processing_time_ms')::integer
    ELSE NULL 
  END as generation_time_ms,
  NULL as tokens_used, -- Not available in prompts table
  performance_metrics as metrics,
  created_at
FROM prompts
WHERE NOT EXISTS (
  SELECT 1 FROM optimization_history 
  WHERE optimization_history.prompt_id = prompts.id
);