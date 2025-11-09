// Master Grader - Unified prompt scoring system for Lab and Optimizer
// Philosophy: Grade the prompt by its results when possible, structure when not

export type PromptType = 'complex' | 'creative';

export interface CategoryScores {
  clarity: number;
  specificity: number;
  efficiency: number;
  structure: number;
  constraints: number;
  elaboration: number;
  intent_alignment: number;
  adaptability: number;
}

export interface MasterGradeResult {
  scores: CategoryScores;
  totalScore: number;
  metadata: {
    mode: 'static' | 'tested' | 'compared';
    testedWithAI: boolean;
    outputLength?: number;
  };
}

// Common words set for nonsense detection
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said',
  'did', 'having', 'may', 'should', 'am', 'being', 'write', 'create', 'generate', 'make', 'provide'
]);

/**
 * Detects nonsense or gibberish prompts
 */
export function detectNonsense(prompt: string, output?: string): number {
  const words = prompt.toLowerCase().split(/\s+/);
  const alphaRatio = (prompt.match(/[a-z]/gi) || []).length / prompt.length;
  
  if (alphaRatio < 0.5) return 0.3;
  
  const englishWords = words.filter(w => COMMON_WORDS.has(w) || w.length > 12);
  const englishRatio = englishWords.length / words.length;
  
  if (englishRatio < 0.3) return 0.2;
  if (output && output.includes('cannot') && output.includes('unclear')) return 0.1;
  
  return 1.0;
}

/**
 * Calculate Intent Alignment - ONLY meaningful with actual output
 */
/**
 * Detect the type of prompt for task-aware grading
 */
export function detectPromptType(prompt: string): PromptType {
  const promptLower = prompt.toLowerCase();
  
  // CREATIVE prompts - explicit creative intent
  const creativeKeywords = /\b(?:write|create|generate|compose)\s+(?:a|an)\s+(?:poem|story|haiku|tagline|slogan|joke|metaphor|song|rap|limerick|narrative|character|scene)/i;
  if (creativeKeywords.test(prompt)) return 'creative';
  
  // All other prompts are complex
  return 'complex';
}

/**
 * Get contextual weights based on prompt type
 */
export function getContextualWeights(promptType: PromptType): Record<keyof CategoryScores, number> {
  switch (promptType) {
    case 'creative':
      return {
        clarity: 1.5,
        specificity: 1.2,
        efficiency: 1.3,
        structure: 0.6,
        constraints: 0.5,
        elaboration: 0.8,
        intent_alignment: 1.8, // Very important
        adaptability: 1.4      // Creative freedom matters
      };
      
    case 'complex':
      return {
        clarity: 1.5,           // Always important
        specificity: 1.3,       // Need details
        efficiency: 1.0,        // Balance verbosity
        structure: 1.2,         // ⭐ Organization matters
        constraints: 1.2,       // ⭐ Boundaries help
        elaboration: 1.3,       // ⭐ Examples/context crucial
        intent_alignment: 1.4,  // Clear goals needed
        adaptability: 0.8       // Some flexibility
      };
  }
}

/**
 * Calculate Intent Alignment - ONLY meaningful with actual output
 */
export function calculateIntentAlignment(prompt: string, output?: string): number {
  const promptLower = prompt.toLowerCase();
  
  // Static analysis (baseline)
  const hasGoal = /(?:write|create|generate|make|provide|explain|list|analyze|compare|design|build)/i.test(prompt);
  const hasOutcome = /(?:that|which|should|must|will|would)/.test(promptLower);
  const hasSuccessCriteria = /(?:ensure|make sure|verify|check|include|contain|focus on)/i.test(prompt);
  
  let staticScore = 3;
  if (hasGoal) staticScore += 2;
  if (hasOutcome) staticScore += 1;
  if (hasSuccessCriteria) staticScore += 2;
  
  // If no output, return static score (capped at 8)
  if (!output) return Math.min(8, staticScore);
  
  // Output-based validation (THE REAL SCORE)
  const outputLower = output.toLowerCase();
  
  const wantsExplanation = /explain|why|how|describe|what is|define/.test(promptLower);
  const wantsList = /list|steps|ways|methods|examples|items/.test(promptLower);
  const wantsComparison = /compare|contrast|difference|versus|vs\./.test(promptLower);
  const wantsCreative = /creative|funny|witty|catchy|clever|engaging/.test(promptLower);
  const wantsCode = /code|function|script|program|implement/.test(promptLower);
  const wantsFormat = /json|markdown|table|csv|html/.test(promptLower);
  
  const hasExplanation = wantsExplanation && /because|due to|reason|this means|therefore|thus|since/.test(outputLower);
  const hasList = wantsList && /(?:\n\s*[-*•]\s|\n\s*\d+[\.)]\s)/.test(output);
  const hasComparison = wantsComparison && /while|whereas|however|on the other hand|in contrast|compared to/.test(outputLower);
  const isCreative = wantsCreative && (output.length < 300 || /[!?]{2,}|[.]{3}/.test(output));
  const hasCode = wantsCode && /```|function |def |class |const |let |var /.test(output);
  const matchesFormat = wantsFormat && (
    (promptLower.includes('json') && /^\s*[\{\[]/.test(output)) ||
    (promptLower.includes('markdown') && /#{1,6}\s/.test(output)) ||
    (promptLower.includes('table') && /\|.*\|/.test(output))
  );
  
  let score = 5; // Baseline when tested
  if (wantsExplanation && hasExplanation) score += 2;
  if (wantsList && hasList) score += 2;
  if (wantsComparison && hasComparison) score += 2;
  if (wantsCreative && isCreative) score += 1;
  if (wantsCode && hasCode) score += 2;
  if (wantsFormat && matchesFormat) score += 2;
  
  return Math.min(10, score);
}

/**
 * Static Mode Scoring - Fast structural analysis
 */
export interface StaticGradeResult {
  scores: CategoryScores;
  promptType: PromptType;
}

export function scorePromptStatic(prompt: string): StaticGradeResult {
  const promptType = detectPromptType(prompt);
  const promptLower = prompt.toLowerCase();
  const words = prompt.split(/\s+/);
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // 1. CLARITY (0-10)
  const hasActionVerb = /^(?:write|create|generate|make|provide|explain|list|analyze|compare|design|build|develop|implement|describe)/i.test(prompt.trim());
  const vaguePhrases = (prompt.match(/\b(?:good|nice|stuff|thing|something|somehow|kind of|sort of)\b/gi) || []).length;
  const ambiguousPronouns = (prompt.match(/\b(?:it|this|that|they|them)\b/gi) || []).length;
  const hasClearSubject = sentences.length > 0 && sentences[0].split(/\s+/).length > 3;
  
  let clarity = 5;
  if (hasActionVerb) clarity += 2;
  if (hasClearSubject) clarity += 1;
  if (vaguePhrases === 0) clarity += 1;
  if (ambiguousPronouns < 2) clarity += 1;
  else clarity -= Math.min(2, ambiguousPronouns);
  
  // 2. SPECIFICITY (0-10)
  const hasNumbers = /\b\d+\b/.test(prompt);
  const hasFormat = /\b(?:json|markdown|html|csv|table|list|bullet|paragraph|essay|email|code)\b/i.test(prompt);
  const hasTone = /\b(?:formal|casual|professional|friendly|technical|simple|detailed|concise|brief)\b/i.test(prompt);
  const hasConcreteNouns = (prompt.match(/\b(?:company|product|user|customer|article|report|website|app|system|team|project)\b/gi) || []).length;
  const wordCount = words.length;
  
  let specificity = 0;
  if (hasNumbers) specificity += 2;
  if (hasFormat) specificity += 2;
  if (hasTone) specificity += 2;
  if (hasConcreteNouns > 0) specificity += 2;
  if (wordCount > 15) specificity += 1;
  if (wordCount > 30) specificity += 1;
  
  // 3. EFFICIENCY (0-10)
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const uniqueRatio = uniqueWords / words.length;
  const fillerWords = (prompt.match(/\b(?:basically|actually|literally|very|really|just|simply|totally|completely|absolutely)\b/gi) || []).length;
  const repetitivePhrases = detectRepetition(prompt);
  
  let efficiency = 10;
  if (uniqueRatio < 0.6) efficiency -= 2;
  if (fillerWords >= 3) efficiency -= 2;
  if (repetitivePhrases) efficiency -= 3;
  if (wordCount > 100 && !promptLower.includes('example')) efficiency -= 1;
  
  // 4. STRUCTURE (0-10)
  const hasSteps = /\b(?:first|second|third|then|next|finally|lastly|step \d+)\b/i.test(prompt);
  const hasSections = (prompt.match(/\n\n+/g) || []).length >= 1;
  const hasBullets = /(?:\n\s*[-*•]\s|\n\s*\d+[\.)]\s)/.test(prompt);
  const hasHeaders = /(?:\n#{1,6}\s|^#{1,6}\s|\n[A-Z][^.!?]*:)/.test(prompt);
  
  let structure = 4;
  if (hasSteps) structure += 2;
  if (hasSections) structure += 2;
  if (hasBullets) structure += 2;
  if (hasHeaders) structure += 1;
  
  // 5. CONSTRAINTS (0-10)
  const boundaryWords = (prompt.match(/\b(?:must|should|need to|have to|required|necessary)\b/gi) || []).length;
  const negativeConstraints = (prompt.match(/\b(?:don't|do not|avoid|never|without|exclude|not include)\b/gi) || []).length;
  const quantitativeLimits = (prompt.match(/\b(?:no more than|at least|maximum|minimum|exactly|between \d+ and \d+)\b/gi) || []).length;
  const formatRestrictions = (prompt.match(/\b(?:only|just|exclusively|specifically)\b/gi) || []).length;
  
  let constraints = 3;
  if (boundaryWords > 0) constraints += 2;
  if (negativeConstraints > 0) constraints += 2;
  if (quantitativeLimits > 0) constraints += 2;
  if (formatRestrictions > 0) constraints += 1;
  
  // 6. ELABORATION (0-10) - STRICT
  // Real example blocks with actual content (30+ chars after keyword)
  const exampleBlocks = (prompt.match(/(?:example|such as|e\.g\.|for instance)[:\s]+.{30,}/gi) || []).length;
  const numberedExamples = (prompt.match(/(?:example\s*\d+|e\.g\.|for instance)[:\s]+.{30,}/gi) || []).length;
  const bulletExamples = (prompt.match(/(?:[-•*]\s+.{30,}.*(?:shows?|demonstrates?|illustrates?))/gi) || []).length;
  const actualExampleCount = exampleBlocks + numberedExamples + bulletExamples;
  
  const hasBackground = /\b(?:background|context|because|since|given that|considering)\b/i.test(prompt) && wordCount > 30;
  const hasPurpose = /\b(?:purpose|goal|aim|objective|in order to|so that)\b/i.test(prompt);
  const hasReasoning = /\b(?:because|since|due to|as a result|therefore|thus)\b/i.test(prompt);
  
  let elaboration = 3; // Base score
  if (actualExampleCount >= 1) elaboration += 2;
  if (actualExampleCount >= 2) elaboration += 2;
  if (actualExampleCount >= 3) elaboration += 1;
  if (hasBackground) elaboration += 1;
  if (hasPurpose) elaboration += 1;
  if (hasReasoning) elaboration += 1;
  
  // Cap at 8 for static (need output validation for 9-10)
  elaboration = Math.min(8, elaboration);
  
  // 7. INTENT ALIGNMENT (0-10) - Static baseline only
  const intentAlignment = calculateIntentAlignment(prompt);
  
  // 8. ADAPTABILITY (0-10) - Structural robustness for context swapping
  // Not about being generic, but about having a structure that can absorb new contexts
  // while maintaining clarity and strength
  
  // Structural markers: placeholders, variables, roles, sections
  const hasPlaceholders = (prompt.match(/\b(?:\[.*?\]|\{.*?\}|<.*?>|X|Y|TOPIC|SUBJECT|CONTEXT)\b/gi) || []).length;
  const hasVariables = (prompt.match(/\b(?:the topic|this subject|given context|provided information|specified)\b/gi) || []).length;
  const hasRoles = (prompt.match(/\b(?:as a|you are a|acting as|role of|persona of)\b/gi) || []).length;
  
  // Logical separations that allow context swapping
  const hasConditionalLogic = (prompt.match(/\b(?:if|when|based on|depending on|given)\b/gi) || []).length;
  const hasClearSections = (prompt.match(/\n\s*[-*•]\s|1\.|2\.|3\.|:\n/g) || []).length >= 2;
  const hasReusableStructure = /\b(?:for any|regardless of|independent of|applies to)\b/i.test(prompt);
  
  let adaptability = 3; // Lower base - most prompts are context-specific
  if (hasPlaceholders > 0) adaptability += 2; // Strong signal of swappable context
  if (hasVariables > 0) adaptability += 2;    // References abstract inputs
  if (hasRoles > 0) adaptability += 1;        // Role-based can adapt contexts
  if (hasConditionalLogic > 1) adaptability += 1; // Logic branches = flexibility
  if (hasClearSections) adaptability += 1;    // Sections allow partial swapping
  if (hasReusableStructure) adaptability += 1; // Explicitly designed for reuse
  
  // CRITICAL: Round all scores to 1 decimal for consistency
  const scores = {
    clarity: Math.round(Math.max(0, Math.min(10, clarity)) * 10) / 10,
    specificity: Math.round(Math.max(0, Math.min(10, specificity)) * 10) / 10,
    efficiency: Math.round(Math.max(0, Math.min(10, efficiency)) * 10) / 10,
    structure: Math.round(Math.max(0, Math.min(10, structure)) * 10) / 10,
    constraints: Math.round(Math.max(0, Math.min(10, constraints)) * 10) / 10,
    elaboration: Math.round(Math.max(0, Math.min(10, elaboration)) * 10) / 10,
    intent_alignment: Math.round(Math.max(0, Math.min(10, intentAlignment)) * 10) / 10,
    adaptability: Math.round(Math.max(0, Math.min(10, adaptability)) * 10) / 10
  };
  
  
  return {
    scores,
    promptType
  };
}

/**
 * Tested Mode Scoring - Validates with actual AI output
 */
export function scorePromptTested(prompt: string, output: string): { scores: CategoryScores; promptType: PromptType } {
  // Start with static scores
  const staticResult = scorePromptStatic(prompt);
  const scores = staticResult.scores;
  
  const outputLower = output.toLowerCase();
  const outputLength = output.length;
  
  // Enhance CLARITY with output validation
  const outputIsCoherent = outputLength > 20 && !outputLower.includes('i cannot') && !outputLower.includes('unclear');
  const outputIsOnTopic = !outputLower.includes('i need more information');
  if (outputIsCoherent && outputIsOnTopic && scores.clarity >= 7) {
    scores.clarity = Math.min(10, scores.clarity + 2);
  } else if (!outputIsCoherent || !outputIsOnTopic) {
    scores.clarity = Math.max(3, scores.clarity - 2);
  }
  
  // Enhance SPECIFICITY with format matching
  const requestedFormat = prompt.match(/\b(json|markdown|table|csv|html|list)\b/i)?.[0]?.toLowerCase();
  let formatMatches = false;
  if (requestedFormat === 'json') formatMatches = /^\s*[\{\[]/.test(output);
  if (requestedFormat === 'markdown') formatMatches = /#{1,6}\s/.test(output);
  if (requestedFormat === 'table') formatMatches = /\|.*\|/.test(output);
  if (requestedFormat === 'list') formatMatches = /(?:\n\s*[-*•]\s|\n\s*\d+[\.)]\s)/.test(output);
  
  if (formatMatches) scores.specificity = Math.min(10, scores.specificity + 2);
  
  // Enhance EFFICIENCY with output quality
  const outputRambles = outputLength > 500 && (output.match(/\.\s+/g) || []).length < 5;
  const outputIsFocused = !outputRambles && outputLength > 50;
  if (outputRambles) scores.efficiency = Math.max(4, scores.efficiency - 2);
  if (outputIsFocused) scores.efficiency = Math.min(10, scores.efficiency + 1);
  
  // Enhance STRUCTURE with output organization
  const outputHasStructure = /(?:\n\s*[-*•]\s|\n\s*\d+[\.)]\s|#{1,6}\s)/.test(output);
  if (outputHasStructure) scores.structure = Math.min(10, scores.structure + 2);
  
  // Enhance CONSTRAINTS with validation
  const promptConstraints = prompt.match(/\b(?:don't|avoid|never|without|no more than|at least)\b/gi) || [];
  let constraintsRespected = true;
  
  for (const constraint of promptConstraints) {
    if (constraint.toLowerCase().includes("don't") || constraint.toLowerCase().includes("avoid")) {
      const forbiddenWord = prompt.match(new RegExp(constraint + '\\s+(\\w+)', 'i'))?.[1];
      if (forbiddenWord && outputLower.includes(forbiddenWord.toLowerCase())) {
        constraintsRespected = false;
        break;
      }
    }
  }
  
  if (!constraintsRespected) {
    scores.constraints = Math.min(5, scores.constraints);
  } else if (promptConstraints.length > 0) {
    scores.constraints = Math.min(10, scores.constraints + 2);
  }
  
  // Enhance ELABORATION with output quality
  const outputShowsNuance = outputLength > 200 && (output.match(/\b(?:however|although|while|whereas|on the other hand)\b/gi) || []).length > 0;
  if (outputShowsNuance && scores.elaboration >= 7) {
    scores.elaboration = Math.min(10, scores.elaboration + 1);
  } else if (outputLength < 50 && scores.elaboration < 5) {
    scores.elaboration = Math.max(3, scores.elaboration - 1);
  }
  
  // INTENT ALIGNMENT - Use real calculation
  scores.intent_alignment = calculateIntentAlignment(prompt, output);
  
  // ADAPTABILITY - Validate structure maintained clarity with actual context
  // If the prompt has structural markers (placeholders, variables), check if output is coherent
  const hasStructuralMarkers = /\b(?:\[.*?\]|\{.*?\}|<.*?>|the topic|this subject|given context)\b/gi.test(prompt);
  const outputMaintainsClarity = outputLength > 50 && !outputLower.includes('unclear') && !outputLower.includes('i need more');
  
  if (hasStructuralMarkers && outputMaintainsClarity) {
    scores.adaptability = Math.min(10, scores.adaptability + 2); // Structure worked with actual context
  }
  
  
  return {
    scores,
    promptType: staticResult.promptType
  };
}

/**
 * Calculate total score with task-aware weighting
 */
export function calculateTotalScore(
  scores: CategoryScores, 
  promptType?: PromptType,
  prompt?: string
): number {
  // Auto-detect type if not provided
  const detectedType = promptType || (prompt ? detectPromptType(prompt) : 'complex');
  
  // CRITICAL: Use unified weights from ai-grader.ts (no prompt type variations for consistency)
  const weights = {
    clarity: 1.5,
    specificity: 1.3,
    constraints: 1.2,
    elaboration: 1.3,
    efficiency: 1.0,
    structure: 1.2,
    intent_alignment: 1.4,
    adaptability: 0.8,
  };
  
  const weightedSum = 
    scores.clarity * weights.clarity +
    scores.specificity * weights.specificity +
    scores.efficiency * weights.efficiency +
    scores.structure * weights.structure +
    scores.constraints * weights.constraints +
    scores.elaboration * weights.elaboration +
    scores.intent_alignment * weights.intent_alignment +
    scores.adaptability * weights.adaptability;
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalizedScore = (weightedSum / totalWeight);
  
  // Minimum quality threshold (only for complex prompts)
  if (detectedType === 'complex') {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 8;
    if (avgScore < 3.0) return Math.min(normalizedScore, 3.5);
  }
  
  return Math.round(normalizedScore * 10) / 10;
}

/**
 * Helper: Detect repetitive phrases
 */
function detectRepetition(text: string): boolean {
  const phrases = text.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];
  const phraseCounts = new Map<string, number>();
  
  for (const phrase of phrases) {
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    if (phraseCounts.get(phrase)! > 2) return true;
  }
  
  return false;
}

/**
 * Score output quality on 0-10 scale
 * Evaluates AI response characteristics independently of prompt
 */
export function scoreOutputQuality(output: string): number {
  let score = 5; // baseline
  
  const outputLength = output.length;
  const words = output.split(/\s+/).length;
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  
  // Length appropriateness (not too short, not excessively long)
  if (outputLength > 50 && outputLength < 3000) score += 1;
  if (outputLength > 200) score += 0.5;
  
  // Structure quality
  if (avgWordsPerSentence > 8 && avgWordsPerSentence < 30) score += 1;
  if (sentences > 2) score += 0.5;
  
  // Content richness
  const hasVariety = /[,;:]/.test(output); // punctuation variety
  const hasStructure = /(\n|  )/.test(output); // formatting
  if (hasVariety) score += 0.5;
  if (hasStructure) score += 0.5;
  
  // Coherence indicators
  const startsCapital = /^[A-Z]/.test(output.trim());
  const properEnding = /[.!?]$/.test(output.trim());
  if (startsCapital) score += 0.3;
  if (properEnding) score += 0.2;
  
  // Avoid repetitive or low-quality patterns
  const hasRepetition = /(.{20,})\1{2,}/.test(output);
  const tooManyNewlines = (output.match(/\n/g) || []).length > sentences * 2;
  if (hasRepetition) score -= 1.5;
  if (tooManyNewlines) score -= 1;
  
  // Keep in valid range
  return Math.max(0, Math.min(10, score));
}

/**
 * 50/50 Split Scoring - Combines prompt quality + output quality
 * This is the unified scoring function for both Lab and Optimizer
 */
export function scorePromptAndOutput(prompt: string, output: string): {
  scores: CategoryScores;
  promptType: PromptType;
  promptScore: number;
  outputScore: number;
  finalScore: number;
} {
  // 50% - Score the prompt itself
  const staticResult = scorePromptStatic(prompt);
  const promptScore = calculateTotalScore(staticResult.scores, staticResult.promptType, prompt);
  
  // 50% - Score the output quality
  const outputScore = scoreOutputQuality(output);
  
  // Combine 50/50
  const finalScore = (promptScore * 0.5) + (outputScore * 0.5);
  
  return {
    scores: staticResult.scores,
    promptType: staticResult.promptType,
    promptScore,
    outputScore,
    finalScore
  };
}
