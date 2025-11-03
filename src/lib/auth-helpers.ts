import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthResult {
  session: Session;
  accessToken: string;
  userId: string;
}

/**
 * Smart authentication helper that works reliably in both preview and production
 * - First tries getSession() for speed
 * - Falls back to getUser() if token appears stale or missing
 * - Returns guaranteed-valid session with fresh access token
 */
export async function getValidAuth(): Promise<AuthResult> {
  console.log('🔐 Getting valid authentication...');
  
  // First attempt: Try getSession (fast, works in production)
  const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionData?.access_token) {
    // Check if token is about to expire (within 5 minutes)
    const expiresAt = sessionData.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const isExpiringSoon = expiresAt - now < 300;
    
    if (!isExpiringSoon) {
      console.log('✅ Valid session from getSession()');
      return {
        session: sessionData,
        accessToken: sessionData.access_token,
        userId: sessionData.user.id,
      };
    }
    
    console.log('⚠️ Token expiring soon, refreshing...');
  }
  
  // Fallback: Use getUser() to get fresh token (works better in preview/iframe)
  console.log('🔄 Refreshing session with getUser()...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Auth failed:', userError || 'No user');
    throw new Error('Not authenticated. Please sign in again.');
  }
  
  // Get the updated session after getUser()
  const { data: { session: freshSession }, error: freshError } = await supabase.auth.getSession();
  
  if (freshError || !freshSession?.access_token) {
    console.error('❌ Failed to get fresh session:', freshError);
    throw new Error('Failed to refresh authentication. Please sign in again.');
  }
  
  console.log('✅ Fresh session obtained');
  return {
    session: freshSession,
    accessToken: freshSession.access_token,
    userId: user.id,
  };
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Invoke a Supabase edge function with robust authentication
 * Automatically handles token refresh and retries on network failures
 */
export async function invokeWithAuth<T = any>(
  functionName: string,
  body: any,
  options?: {
    retries?: number;
    headers?: Record<string, string>;
  }
): Promise<T> {
  console.log(`🌐 Invoking edge function: ${functionName}`);
  
  return retryWithBackoff(async () => {
    // Get valid auth before each attempt
    const auth = await getValidAuth();
    
    console.log(`📡 Calling ${functionName} with fresh token`);
    const { data, error } = await supabase.functions.invoke(functionName, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        ...options?.headers,
      },
      body,
    });
    
    if (error) {
      console.error(`❌ ${functionName} error:`, error);
      
      // Distinguish error types for better handling
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      
      throw error;
    }
    
    console.log(`✅ ${functionName} succeeded`);
    return data as T;
  }, options?.retries || 2);
}

/**
 * Detect if we're running in preview/iframe environment
 */
export function detectEnvironment() {
  const isIframe = window.self !== window.top;
  const isLovablePreview = window.location.hostname.includes('lovable.app') || 
                           window.location.hostname.includes('lovableproject.com');
  
  return {
    isIframe,
    isLovablePreview,
    isPreview: isIframe || isLovablePreview,
  };
}
