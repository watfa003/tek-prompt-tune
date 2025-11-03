/**
 * Unified API Client for PrompTek
 * Ensures 100% consistent API execution across Preview, Full Preview, and Production
 */

// Unified base URL resolver
const BASE_URL = (() => {
  const devMode =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("lovable.app");
  return devMode
    ? "https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1"
    : "https://tnlthzzjtjvnaqafddnj.supabase.co/functions/v1"; // Using Supabase Functions in all envs for consistency
})();

// Public anon key required by Supabase Functions gateway
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubHRoenpqdGp2bmFxYWZkZG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzUzOTMsImV4cCI6MjA3MzcxMTM5M30.nJQLtEIJOG-5XKAIHH1LH4P7bAQR1ZbYwg8cBUeXNvA";

/**
 * Safe fetch with automatic retry logic
 */
export const safeFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> => {
  const url = `${BASE_URL}/${endpoint}`;
  
  console.log("API called:", url, {
    method: options.method || "GET",
    body: options.body ? "present" : "none",
  });

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          apikey: SUPABASE_ANON_KEY,
          ...(options.headers || {}),
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({} as T));
        console.log("API success:", url, {
          status: res.status,
          hasData: !!data,
        });
        return data as T;
      }

      const errorData = await res.json().catch(() => ({}));
      console.warn("API error:", url, {
        status: res.status,
        statusText: res.statusText,
        body: errorData,
        attempt: i + 1,
      });

      // Build error with status for callers that need branching
      const apiError: any = new Error(
        errorData?.error || errorData?.message || `API error: ${res.status} ${res.statusText}`
      );
      apiError.status = res.status;
      apiError.body = errorData;

      // If it's a client error (4xx), don't retry
      if (res.status >= 400 && res.status < 500) {
        throw apiError;
      }

      // Otherwise fall through to retry
    } catch (err) {
      // Network or thrown apiError above
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Fetch failed:", url, {
        error: msg,
        attempt: i + 1,
      });

      if (i === retries) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }

    // Backoff between retries
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }

  throw new Error(`Failed after ${retries + 1} attempts`);
};

/** Test API connection */
export const testConnection = async (): Promise<boolean> => {
  try {
    await safeFetch("ping", { method: "GET" }, 0);
    return true;
  } catch (err) {
    console.error("Connection test failed:", err);
    return false;
  }
};

/** Lab API */
export interface LabAnalyzeRequest {
  mode: "single" | "compare";
  target_llm: string;
  prompt_a: string;
  prompt_b?: string;
  test_task?: string;
}

export const labAnalyze = async (
  payload: LabAnalyzeRequest,
  authToken: string
): Promise<any> => {
  console.log("🧪 Lab Analyze - Starting request");
  
  const result = await safeFetch("prompt-lab-analyze", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("🧪 Lab Analyze - Request completed");
  return result;
};

/** Optimizer API */
export interface OptimizerRequest {
  originalPrompt: string;
  taskDescription: string;
  aiProvider: string;
  modelName: string;
  outputType: string;
  variants: number;
  userId: string;
  maxTokens?: number | null;
  temperature?: number;
  influence?: string;
  influenceWeight?: number;
  mode: "speed" | "deep";
  autoSave?: boolean;
}

export const optimizePrompt = async (
  payload: OptimizerRequest,
  authToken: string
): Promise<any> => {
  console.log("⚡ Optimizer - Starting request", {
    mode: payload.mode,
    variants: payload.variants,
  });

  const result = await safeFetch("prompt-optimizer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  console.log("⚡ Optimizer - Request completed", {
    mode: payload.mode,
    hasResult: !!result,
  });

  return result;
};

/** Generic function invoker for other endpoints */
export const invokeFunction = async (
  name: string,
  body?: any,
  authToken?: string,
  method: "POST" | "GET" = "POST"
): Promise<any> => {
  return safeFetch(name, {
    method,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
};

/** Sequential helper (optional) */
export const sequentialCalls = async <T1, T2>(
  call1: () => Promise<T1>,
  call2: () => Promise<T2>
): Promise<[T1, T2]> => {
  console.log("📡 Sequential calls - Starting first call");
  const result1 = await call1();
  console.log("📡 Sequential calls - First complete, starting second");
  const result2 = await call2();
  console.log("📡 Sequential calls - Both complete");
  return [result1, result2];
};
