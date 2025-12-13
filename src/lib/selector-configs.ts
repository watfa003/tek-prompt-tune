/**
 * Unified selector configurations with tooltips
 * Used across the app for consistent UX
 */

export interface ProviderConfig {
  id: string;
  label: string;
  tooltip: string;
}

export interface ModelConfig {
  id: string;
  label: string;
  tooltip: string;
  provider: string;
}

export interface ModeConfig {
  id: string;
  label: string;
  tooltip: string;
  icon: string;
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    tooltip: 'Industry leader with GPT models. Best for general-purpose tasks, creative writing, and code generation.'
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    tooltip: 'Known for safety and nuance. Excels at analysis, long documents, and following complex instructions.'
  },
  {
    id: 'google',
    label: 'Google (Gemini)',
    tooltip: 'Multimodal capabilities with fast inference. Great for research, summarization, and diverse tasks.'
  },
  {
    id: 'groq',
    label: 'Groq',
    tooltip: 'Ultra-fast inference on open-source models. Best for speed-critical applications with Llama models.'
  },
  {
    id: 'mistral',
    label: 'Mistral',
    tooltip: 'European AI with strong multilingual support. Great for coding and efficient token usage.'
  }
];

export const MODEL_CONFIGS: ModelConfig[] = [
  // OpenAI
  { id: 'gpt-5-2025-08-07', label: 'GPT-5', provider: 'openai', tooltip: 'Most capable OpenAI model. Best quality for complex reasoning and creative tasks.' },
  { id: 'gpt-5-mini-2025-08-07', label: 'GPT-5 mini', provider: 'openai', tooltip: 'Balanced performance and cost. Good for most everyday tasks.' },
  { id: 'gpt-5-nano-2025-08-07', label: 'GPT-5 nano', provider: 'openai', tooltip: 'Fastest and most affordable. Best for simple, high-volume tasks.' },
  { id: 'gpt-4.1-2025-04-14', label: 'GPT-4.1', provider: 'openai', tooltip: 'Previous generation flagship. Reliable for production workloads.' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', tooltip: 'Optimized GPT-4 with improved speed. Great balance of quality and cost.' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', tooltip: 'Compact and fast. Ideal for simple queries and high-throughput use.' },
  
  // Anthropic
  { id: 'claude-opus-4-1-20250805', label: 'Claude 4 Opus', provider: 'anthropic', tooltip: 'Most powerful Claude. Exceptional at analysis, writing, and complex reasoning.' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude 4 Sonnet', provider: 'anthropic', tooltip: 'Balanced intelligence and speed. Great for everyday professional tasks.' },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'anthropic', tooltip: 'Fastest Claude model. Perfect for quick responses and real-time applications.' },
  
  // Google
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', provider: 'google', tooltip: 'Ultra-lightweight for speed. Best for simple, rapid queries.' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google', tooltip: 'Fast with good quality. Balanced for most use cases.' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'google', tooltip: 'Latest lightweight model. Improved quality while staying fast.' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google', tooltip: 'Latest fast model. Great for multimodal and research tasks.' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google', tooltip: 'Most capable Gemini. Best for complex analysis and long contexts.' },
  
  // Groq
  { id: 'llama-3.1-8b', label: 'Llama 3.1 8B', provider: 'groq', tooltip: 'Open-source on Groq hardware. Extremely fast inference for basic tasks.' },
  
  // Mistral
  { id: 'mistral-large', label: 'Mistral Large', provider: 'mistral', tooltip: 'Flagship Mistral model. Strong multilingual and coding capabilities.' },
  { id: 'mistral-medium', label: 'Mistral Medium', provider: 'mistral', tooltip: 'Balanced Mistral option. Good performance at lower cost.' }
];

export const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'speed',
    label: 'Speed Mode',
    icon: '⚡',
    tooltip: 'Generates 3-5 variants instantly without testing. You pick your favorite. Best for quick iteration and exploration.'
  },
  {
    id: 'deep',
    label: 'Deep Mode',
    icon: '🔬',
    tooltip: 'Tests all variants against 8 quality pillars and auto-selects the best. Best for production-ready prompts.'
  }
];

export function getProviderConfig(id: string): ProviderConfig | undefined {
  return PROVIDER_CONFIGS.find(p => p.id === id);
}

export function getModelsForProvider(provider: string): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.provider === provider);
}

export function getModelConfig(id: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(m => m.id === id);
}

export function getModeConfig(id: string): ModeConfig | undefined {
  return MODE_CONFIGS.find(m => m.id === id);
}
