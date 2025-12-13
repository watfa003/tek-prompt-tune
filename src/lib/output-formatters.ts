/**
 * Output Formatting System for PrompTek
 * Each output type has optimized formatting, tone, and structure rules
 */

import { FileText, Code, List, BookOpen, FileJson } from "lucide-react";

export type OutputType = 'text' | 'essay' | 'list' | 'code' | 'json';

export interface OutputTypeConfig {
  id: OutputType;
  label: string;
  icon: typeof FileText;
  description: string;
  tooltip: string; // "Why choose this" explanation
  promptInstructions: string;
  formatResponse: (content: string) => string;
  validateResponse: (content: string) => boolean;
  getEnhancedSystemPrompt: (basePrompt: string) => string;
}

/**
 * Auto-detect output type from content or user task description
 */
export function detectOutputType(content: string): OutputType {
  const lowerContent = content.toLowerCase();
  
  // JSON detection - highest priority due to structured format
  if (lowerContent.includes('json') || 
      lowerContent.match(/\{[\s\S]*"[\w]+":[\s\S]*\}/) ||
      lowerContent.includes('api response') ||
      lowerContent.includes('data structure')) {
    return 'json';
  }
  
  // Code detection
  if (lowerContent.includes('function') ||
      lowerContent.includes('class') ||
      lowerContent.includes('const ') ||
      lowerContent.includes('var ') ||
      lowerContent.includes('def ') ||
      lowerContent.includes('import ') ||
      lowerContent.match(/```[\s\S]*```/) ||
      lowerContent.includes('code') ||
      lowerContent.includes('script') ||
      lowerContent.includes('program')) {
    return 'code';
  }
  
  // List detection
  if (lowerContent.includes('list') ||
      lowerContent.includes('steps') ||
      lowerContent.includes('bullet') ||
      lowerContent.includes('numbered') ||
      lowerContent.includes('pros and cons') ||
      lowerContent.includes('checklist') ||
      lowerContent.includes('items') ||
      lowerContent.match(/^\s*[-*•]\s/m) ||
      lowerContent.match(/^\s*\d+\.\s/m)) {
    return 'list';
  }
  
  // Essay detection
  if (lowerContent.includes('essay') ||
      lowerContent.includes('article') ||
      lowerContent.includes('analysis') ||
      lowerContent.includes('argument') ||
      lowerContent.includes('persuasive') ||
      lowerContent.includes('academic') ||
      lowerContent.includes('thesis') ||
      lowerContent.includes('introduction') ||
      lowerContent.includes('conclusion') ||
      (lowerContent.split(' ').length > 20 && 
       (lowerContent.includes('discuss') || lowerContent.includes('explain in detail')))) {
    return 'essay';
  }
  
  // Default to text for short-form content
  return 'text';
}

/**
 * Format code with proper syntax highlighting markers
 */
function formatCodeBlock(content: string): string {
  // If already in code block, return as is
  if (content.trim().startsWith('```')) {
    return content;
  }
  
  // Detect language from content
  let language = '';
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('function') || lowerContent.includes('const ') || lowerContent.includes('=>')) {
    language = 'javascript';
  } else if (lowerContent.includes('def ') || lowerContent.includes('import ')) {
    language = 'python';
  } else if (lowerContent.includes('<html') || lowerContent.includes('<div')) {
    language = 'html';
  } else if (lowerContent.includes('select ') || lowerContent.includes('from ')) {
    language = 'sql';
  } else if (lowerContent.includes('{') && lowerContent.includes('"')) {
    language = 'json';
  }
  
  return `\`\`\`${language}\n${content.trim()}\n\`\`\``;
}

/**
 * Format list with proper structure
 */
function formatList(content: string): string {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Check if numbered or bulleted
  const isNumbered = lines.some(line => /^\d+\./.test(line));
  
  if (isNumbered) {
    // Ensure consistent numbering
    return lines.map((line, index) => {
      const cleaned = line.replace(/^\d+\.\s*/, '');
      return `${index + 1}. ${cleaned}`;
    }).join('\n');
  } else {
    // Ensure consistent bullet points
    return lines.map(line => {
      const cleaned = line.replace(/^[-*•]\s*/, '');
      return `• ${cleaned}`;
    }).join('\n');
  }
}

/**
 * Validate and format JSON
 */
function formatJSON(content: string): string {
  try {
    // Try to extract JSON from text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed, null, 2);
    }
    
    // Try parsing the entire content
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not valid JSON, return formatted structure
    return content;
  }
}

/**
 * Output type configurations
 */
export const OUTPUT_TYPE_CONFIGS: Record<OutputType, OutputTypeConfig> = {
  text: {
    id: 'text',
    label: 'Text',
    icon: FileText,
    description: 'Generates short, natural language responses or summaries.',
    tooltip: 'Best for quick answers, summaries, and conversational responses. Keeps things simple without heavy formatting.',
    promptInstructions: 'Write a clear, concise response in natural paragraph form. Keep sentences short and readable. Use a professional yet approachable tone. No headings or excessive structure - just well-written text.',
    formatResponse: (content: string) => {
      // Clean up excessive line breaks
      return content.trim().replace(/\n{3,}/g, '\n\n');
    },
    validateResponse: (content: string) => {
      return content.length > 0 && content.split('\n\n').length <= 5;
    },
    getEnhancedSystemPrompt: (basePrompt: string) => {
      return `${basePrompt}\n\nFormatting Rules for Text Output:
- Write in clear, concise paragraphs
- Keep sentences short and natural (15-20 words max)
- Use professional yet approachable tone
- No headings, lists, or excessive structure
- Focus on readability and clarity
- Aim for 2-4 paragraphs maximum`;
    }
  },
  
  essay: {
    id: 'essay',
    label: 'Essay',
    icon: BookOpen,
    description: 'Creates structured long-form content with intro, body, and conclusion.',
    tooltip: 'Best for articles, analysis, and academic writing. Enforces intro → body → conclusion structure with logical flow.',
    promptInstructions: 'Write a well-structured essay with clear introduction, body paragraphs, and conclusion. Use coherent transitions between sections. Maintain logical flow and academic tone. Support arguments with clear reasoning.',
    formatResponse: (content: string) => {
      // Ensure proper paragraph spacing
      return content.trim().replace(/\n{3,}/g, '\n\n');
    },
    validateResponse: (content: string) => {
      const paragraphs = content.split('\n\n').filter(Boolean);
      return paragraphs.length >= 3; // At least intro, body, conclusion
    },
    getEnhancedSystemPrompt: (basePrompt: string) => {
      return `${basePrompt}\n\nFormatting Rules for Essay Output:
- Structure: Introduction → Body Paragraphs → Conclusion
- Introduction: Present topic and thesis clearly
- Body: 2-4 paragraphs with coherent arguments and transitions
- Conclusion: Summarize key points and reinforce thesis
- Use academic tone with clear, logical flow
- Each paragraph should have a clear topic sentence
- Maintain professional, analytical writing style`;
    }
  },
  
  list: {
    id: 'list',
    label: 'List',
    icon: List,
    description: 'Outputs clean, ordered or bulleted lists of key points or steps.',
    tooltip: 'Best for step-by-step guides, features, pros/cons, or any content that benefits from bullet points or numbered items.',
    promptInstructions: 'Create a clean, structured list with consistent formatting. Use bullets for unordered items, numbers for sequential steps. Ensure each item is concise and parallel in structure. Support nested lists when needed.',
    formatResponse: formatList,
    validateResponse: (content: string) => {
      const lines = content.split('\n').filter(Boolean);
      return lines.length > 0 && lines.some(line => /^[-*•\d]/.test(line.trim()));
    },
    getEnhancedSystemPrompt: (basePrompt: string) => {
      return `${basePrompt}\n\nFormatting Rules for List Output:
- Use numbered lists (1., 2., 3.) for sequential steps or ranked items
- Use bullet points (•) for unordered items, ideas, or features
- Keep each item concise (1-2 lines max)
- Maintain parallel structure across all items
- Use nested lists for sub-items when appropriate
- Ensure consistent spacing and formatting
- Start each item with a strong action verb or clear noun`;
    }
  },
  
  code: {
    id: 'code',
    label: 'Code',
    icon: Code,
    description: 'Generates syntax-highlighted, valid programming code with minimal comments.',
    tooltip: 'Best for generating functions, scripts, or code snippets. Outputs clean, properly indented code with syntax highlighting.',
    promptInstructions: 'Generate clean, well-formatted code with proper indentation and syntax. Include minimal inline comments only when necessary. Follow best practices for the specific language. Use fenced code blocks with language specification.',
    formatResponse: formatCodeBlock,
    validateResponse: (content: string) => {
      // Check for code-like patterns
      return /[{}()\[\];]/.test(content) || content.includes('function') || content.includes('class');
    },
    getEnhancedSystemPrompt: (basePrompt: string) => {
      return `${basePrompt}\n\nFormatting Rules for Code Output:
- Use proper fenced code blocks with language specification (\`\`\`language)
- Follow language-specific best practices and conventions
- Maintain clean, consistent indentation (2 or 4 spaces)
- Include minimal inline comments only for complex logic
- Use meaningful variable and function names
- Ensure proper spacing around operators and brackets
- Handle edge cases and errors appropriately
- Keep functions focused and modular`;
    }
  },
  
  json: {
    id: 'json',
    label: 'JSON',
    icon: FileJson,
    description: 'Returns valid, parsable JSON objects — perfect for API use.',
    tooltip: 'Best for API responses, data structures, or machine-readable output. Returns valid, parsable JSON with no extra text.',
    promptInstructions: 'Return valid, properly formatted JSON only. No additional commentary or explanation. Use consistent key naming (camelCase or snake_case). Include clear type structure. Support nested objects and arrays.',
    formatResponse: formatJSON,
    validateResponse: (content: string) => {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          JSON.parse(jsonMatch[0]);
          return true;
        }
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
    },
    getEnhancedSystemPrompt: (basePrompt: string) => {
      return `${basePrompt}\n\nFormatting Rules for JSON Output:
- Return ONLY valid, parsable JSON - no commentary or explanations
- Use consistent key naming convention (preferably camelCase)
- Include clear, descriptive key names
- Use proper data types (string, number, boolean, null, array, object)
- Format with proper indentation (2 spaces) for readability
- Support nested structures appropriately
- Include sample data that matches the schema
- Ensure all brackets and quotes are properly closed`;
    }
  }
};

/**
 * Get output type config by ID
 */
export function getOutputTypeConfig(type: OutputType): OutputTypeConfig {
  return OUTPUT_TYPE_CONFIGS[type];
}

/**
 * Get all output types
 */
export function getAllOutputTypes(): OutputTypeConfig[] {
  return Object.values(OUTPUT_TYPE_CONFIGS);
}

/**
 * Format content based on output type
 */
export function formatOutput(content: string, type: OutputType): string {
  const config = getOutputTypeConfig(type);
  return config.formatResponse(content);
}

/**
 * Validate content matches output type expectations
 */
export function validateOutput(content: string, type: OutputType): boolean {
  const config = getOutputTypeConfig(type);
  return config.validateResponse(content);
}
