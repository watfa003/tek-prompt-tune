/**
 * Output Type Optimization Strategies
 * 
 * These strategies complement existing optimization strategies by adding
 * format-specific guidance for different output types (Text, Essay, List, Code, JSON).
 */

export type OutputType = 'text' | 'essay' | 'list' | 'code' | 'json';

export interface OutputTypeStrategy {
  name: string;
  description: string;
  formatInstructions: string;
  systemPromptAddition: string;
  getOptimizationGuidance: (maxTokens?: number) => string;
}

export const OUTPUT_TYPE_STRATEGIES: Record<OutputType, OutputTypeStrategy> = {
  text: {
    name: 'CLARITY & TONE',
    description: 'Concise, natural language responses in paragraph format',
    formatInstructions: 'Respond in clear, well-structured paragraphs with natural tone.',
    systemPromptAddition: 'Focus on clarity and readability. Use paragraph format with proper flow between ideas.',
    getOptimizationGuidance: (maxTokens?: number) => {
      const tokenGuidance = maxTokens ? ` Keep the response under ${maxTokens} tokens.` : '';
      return `Structure your response in clear paragraphs. Maintain an informative tone with clean structure.${tokenGuidance}`;
    }
  },

  essay: {
    name: 'STRUCTURE & STEPS',
    description: 'Introduction → Body → Conclusion format with logical progression',
    formatInstructions: 'Write in essay format with introduction, body paragraphs, and conclusion.',
    systemPromptAddition: 'Ensure logical structure with intro → body → conclusion. Encourage coherent progression of ideas.',
    getOptimizationGuidance: (maxTokens?: number) => {
      const tokenGuidance = maxTokens ? ` Keep the entire essay within ${maxTokens} tokens.` : '';
      return `Write an essay with:\n- An introduction that sets context\n- 2-3 body paragraphs developing the main points\n- A conclusion that synthesizes the ideas${tokenGuidance}`;
    }
  },

  list: {
    name: 'STRUCTURED ENUMERATION',
    description: 'Numbered or bulleted lists of ideas, facts, or steps',
    formatInstructions: 'Return as a clear bullet-point or numbered list.',
    systemPromptAddition: 'Format output as a structured list. Each item should be concise and actionable.',
    getOptimizationGuidance: (maxTokens?: number) => {
      const tokenGuidance = maxTokens ? ` Keep the total response under ${maxTokens} tokens.` : '';
      return `Return your response as a clear bullet-point list. Each item should be:\n- Concise and focused\n- Easy to scan\n- Logically ordered${tokenGuidance}`;
    }
  },

  code: {
    name: 'CODE DIRECTIVES',
    description: 'Clean, executable code in a defined language',
    formatInstructions: 'Respond only with valid, executable code. No explanations unless requested.',
    systemPromptAddition: 'Generate clean, syntactically correct code. Prioritize readability and best practices.',
    getOptimizationGuidance: (maxTokens?: number) => {
      const tokenGuidance = maxTokens ? ` Keep the code concise, under ${maxTokens} tokens.` : '';
      return `Respond only with valid code:\n- Include necessary imports/dependencies\n- Follow language-specific best practices\n- Ensure proper syntax and formatting\n- Add brief inline comments for complex logic${tokenGuidance}`;
    }
  },

  json: {
    name: 'SCHEMA-FORMATTED OUTPUT',
    description: 'Valid JSON object/array with defined keys',
    formatInstructions: 'Return only valid, parsable JSON. No prose or commentary.',
    systemPromptAddition: 'Generate valid JSON with consistent typing. Ensure proper formatting and parseability.',
    getOptimizationGuidance: (maxTokens?: number) => {
      const tokenGuidance = maxTokens ? ` Keep the JSON output under ${maxTokens} tokens.` : '';
      return `Return only a valid JSON object or array:\n- Use consistent key naming (camelCase recommended)\n- Ensure proper data types\n- No trailing commas\n- Properly escaped strings\n- Parsable by JSON.parse()${tokenGuidance}`;
    }
  }
};

/**
 * Get the output type strategy for a given type
 */
export function getOutputTypeStrategy(outputType: OutputType): OutputTypeStrategy {
  return OUTPUT_TYPE_STRATEGIES[outputType];
}

/**
 * Generate the system prompt addition for output type
 */
export function getOutputTypeSystemPrompt(outputType: OutputType): string {
  const strategy = OUTPUT_TYPE_STRATEGIES[outputType];
  return `\n\nOUTPUT FORMAT REQUIREMENT:\n${strategy.systemPromptAddition}`;
}

/**
 * Generate optimization guidance to embed in the optimized prompt
 */
export function getOutputTypeGuidance(outputType: OutputType, maxTokens?: number): string {
  const strategy = OUTPUT_TYPE_STRATEGIES[outputType];
  return strategy.getOptimizationGuidance(maxTokens);
}

/**
 * Create a comprehensive optimization instruction that combines
 * output type strategy with other selected strategies
 */
export function createOutputTypeInstruction(
  outputType: OutputType,
  selectedStrategies: string[],
  maxTokens?: number
): string {
  const strategy = OUTPUT_TYPE_STRATEGIES[outputType];
  const strategyList = selectedStrategies.map(s => `- ${s}`).join('\n');
  
  return `You are a prompt optimization expert. Apply the following strategies:

${strategyList}
- ${strategy.name}: ${strategy.description}

When optimizing, ensure the final prompt includes clear guidance for ${outputType} format output.
${maxTokens ? `Respect the token limit of ${maxTokens} tokens.` : ''}`;
}
