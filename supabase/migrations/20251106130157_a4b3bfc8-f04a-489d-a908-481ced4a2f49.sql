-- Add key_type column to distinguish between agent and user keys
ALTER TABLE api_keys 
ADD COLUMN key_type text NOT NULL DEFAULT 'agent'
CHECK (key_type IN ('agent', 'user'));

-- Make agent_id nullable for user-level keys
ALTER TABLE api_keys 
ALTER COLUMN agent_id DROP NOT NULL;

-- Add constraint: agent keys must have agent_id, user keys must not
ALTER TABLE api_keys 
ADD CONSTRAINT agent_key_requires_agent 
CHECK (
  (key_type = 'user' AND agent_id IS NULL) OR
  (key_type = 'agent' AND agent_id IS NOT NULL)
);

-- Add index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);