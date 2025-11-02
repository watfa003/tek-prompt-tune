// ============================================
// API RELIABILITY UTILITIES
// Shared retry logic, timeouts, and error handling
// ============================================

// Unified timeout configuration
export const API_TIMEOUTS = {
  OPTIMIZATION: 30000,     // 30s for optimization calls (complex)
  TESTING: 25000,          // 25s for test calls
  SIMPLE: 15000,           // 15s for simple chat calls
  TOTAL_REQUEST: 120000    // 2 min total request limit
};

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: parseInt(Deno.env.get('MAX_API_RETRIES') || '3'),
  BASE_DELAY: parseInt(Deno.env.get('RETRY_BASE_DELAY') || '1000'),
  ENABLE_FALLBACK: Deno.env.get('ENABLE_FALLBACK') !== 'false'
};

/**
 * Exponential backoff retry wrapper
 * Retries transient errors (429, 503, timeouts, connection errors)
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  baseDelay: number = RETRY_CONFIG.BASE_DELAY
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isLastAttempt = attempt === maxRetries;
      
      // Determine if error is retryable
      const isRetryable = 
        errorMsg.includes('429') || // Rate limit
        errorMsg.includes('timeout') || // Network timeout
        errorMsg.includes('503') || // Service unavailable
        errorMsg.includes('502') || // Bad gateway
        errorMsg.includes('ECONNRESET') || // Connection reset
        errorMsg.includes('ETIMEDOUT'); // Connection timeout
      
      if (!isRetryable || isLastAttempt) {
        console.error(`❌ [${context}] Failed after ${attempt} attempts:`, errorMsg);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential: 1s, 2s, 4s
      console.log(`🔁 [${context}] Retry ${attempt}/${maxRetries} after ${delay}ms: ${errorMsg}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Fetch with timeout using AbortController
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number,
  context: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(`⏱️ [${context}] Timeout after ${timeoutMs}ms for ${url}`);
  }, timeoutMs);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Comprehensive API call logging
 */
export function logAPICall(context: {
  function: string;
  operation: string;
  provider: string;
  model: string;
  attempt: number;
  success: boolean;
  duration: number;
  error?: string;
  statusCode?: number;
}) {
  const emoji = context.success ? '✅' : '❌';
  console.log(`${emoji} [${context.function}] ${context.operation}: ${context.provider}/${context.model}`, {
    attempt: context.attempt,
    success: context.success,
    duration: `${context.duration}ms`,
    status: context.statusCode,
    error: context.error
  });
}

/**
 * Track rate limit headers from API responses
 */
export function trackRateLimit(response: Response, context: string) {
  if (response.headers.has('x-ratelimit-remaining')) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    console.log(`⚡ [${context}] Rate limit: ${remaining}/${limit} remaining`);
    
    // Warn if approaching limit
    if (remaining && parseInt(remaining) < 5) {
      console.warn(`⚠️ [${context}] Approaching rate limit: ${remaining} requests left`);
    }
  }
}

/**
 * Map provider/model combinations to Lovable AI Gateway models
 */
export function mapToLovableModel(provider: string, model: string): string {
  if (provider === 'openai') {
    if (model.includes('gpt-5-nano')) return 'openai/gpt-5-nano';
    if (model.includes('gpt-5-mini')) return 'openai/gpt-5-mini';
    if (model.includes('gpt-5')) return 'openai/gpt-5';
    if (model.includes('gpt-4.1-mini')) return 'openai/gpt-5-mini';
    if (model.includes('gpt-4.1')) return 'openai/gpt-5';
    if (model.includes('gpt-4o-mini')) return 'openai/gpt-5-mini';
    if (model.includes('gpt-4o')) return 'openai/gpt-5';
    return 'openai/gpt-5-mini'; // Default
  }
  
  if (provider === 'google') {
    if (model.includes('pro')) return 'google/gemini-2.5-pro';
    if (model.includes('flash-lite')) return 'google/gemini-2.5-flash-lite';
    return 'google/gemini-2.5-flash';
  }
  
  if (provider === 'anthropic') {
    if (model.includes('opus')) return 'google/gemini-2.5-pro';
    if (model.includes('sonnet')) return 'google/gemini-2.5-flash';
    return 'google/gemini-2.5-flash';
  }
  
  // Default to Gemini Flash for all other providers
  return 'google/gemini-2.5-flash';
}

/**
 * Unified Lovable AI Gateway caller with retry logic
 */
export async function callLovableGateway(params: {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature?: number;
  context: string;
}): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
  
  const mappedModel = mapToLovableModel(params.provider, params.model);
  
  const body: any = {
    model: mappedModel,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userPrompt }
    ],
  };
  
  // Handle token parameters correctly per model
  if (mappedModel.startsWith('openai/gpt-5')) {
    body.max_completion_tokens = params.maxTokens;
    // GPT-5 doesn't support temperature
  } else {
    body.max_tokens = params.maxTokens;
    if (params.temperature !== undefined) {
      body.temperature = params.temperature;
    }
  }
  
  console.log(`📦 [${params.context}] Lovable AI request:`, {
    mappedModel,
    provider: params.provider,
    originalModel: params.model,
    maxTokens: params.maxTokens,
    temp: params.temperature
  });
  
  const startTime = Date.now();
  
  const response = await callWithRetry(
    () => fetchWithTimeout(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      API_TIMEOUTS.OPTIMIZATION,
      params.context
    ),
    params.context
  );
  
  const duration = Date.now() - startTime;
  
  trackRateLimit(response, params.context);
  
  if (!response.ok) {
    const errText = await response.text();
    console.error(`❌ [${params.context}] Gateway error ${response.status}:`, errText);
    
    logAPICall({
      function: params.context,
      operation: 'Gateway Call',
      provider: params.provider,
      model: mappedModel,
      attempt: 1,
      success: false,
      duration,
      error: errText,
      statusCode: response.status
    });
    
    if (response.status === 429) throw new Error('Rate limits exceeded (429)');
    if (response.status === 402) throw new Error('Payment required (402)');
    throw new Error(`Gateway error: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  
  if (!content) {
    const finish = data?.choices?.[0]?.finish_reason;
    console.error(`❌ [${params.context}] No content returned. Finish: ${finish}`);
    throw new Error(`No content returned. Finish: ${finish}`);
  }
  
  logAPICall({
    function: params.context,
    operation: 'Gateway Call',
    provider: params.provider,
    model: mappedModel,
    attempt: 1,
    success: true,
    duration,
    statusCode: response.status
  });
  
  console.log(`✅ [${params.context}] Gateway success:`, mappedModel, 'len:', content.length);
  return content;
}
