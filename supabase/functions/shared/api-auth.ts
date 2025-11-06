import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export interface ValidatedUserKey {
  userId: string;
  keyType: 'user';
}

export interface ValidatedAgentKey {
  userId: string;
  agentId: string;
  keyType: 'agent';
}

/**
 * Validate a user-level API key (for history, favorites, lab endpoints)
 */
export async function validateUserApiKey(
  apiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<ValidatedUserKey> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, key_type')
    .eq('key', apiKey)
    .eq('key_type', 'user')
    .single();

  if (error || !data) {
    throw new Error('Invalid or unauthorized API key');
  }

  return {
    userId: data.user_id,
    keyType: 'user'
  };
}

/**
 * Validate an agent-specific API key (for agent-invoke endpoint)
 */
export async function validateAgentApiKey(
  apiKey: string,
  agentId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<ValidatedAgentKey> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, agent_id, key_type')
    .eq('key', apiKey)
    .eq('key_type', 'agent')
    .eq('agent_id', agentId)
    .single();

  if (error || !data) {
    throw new Error('Invalid API key or agent mismatch');
  }

  return {
    userId: data.user_id,
    agentId: data.agent_id,
    keyType: 'agent'
  };
}

/**
 * Extract API key from request headers or body
 */
export function extractApiKey(req: Request, body?: any): string {
  // Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Try request body
  if (body?.apiKey) {
    return body.apiKey;
  }

  throw new Error('Missing API key. Provide either "apiKey" in request body or "Authorization: Bearer YOUR_KEY" header');
}
