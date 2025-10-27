import { useState, useCallback } from 'react';
import { 
  OutputType, 
  detectOutputType, 
  formatOutput, 
  validateOutput,
  getOutputTypeConfig 
} from '@/lib/output-formatters';

export function useOutputFormatter() {
  const [currentType, setCurrentType] = useState<OutputType>('text');

  /**
   * Auto-detect and set output type from content
   */
  const autoDetectType = useCallback((content: string): OutputType => {
    const detectedType = detectOutputType(content);
    setCurrentType(detectedType);
    return detectedType;
  }, []);

  /**
   * Format content based on current or specified type
   */
  const format = useCallback((content: string, type?: OutputType): string => {
    const outputType = type || currentType;
    return formatOutput(content, outputType);
  }, [currentType]);

  /**
   * Validate content matches type expectations
   */
  const validate = useCallback((content: string, type?: OutputType): boolean => {
    const outputType = type || currentType;
    return validateOutput(content, outputType);
  }, [currentType]);

  /**
   * Reformat existing content when type changes
   */
  const reformatAs = useCallback((content: string, newType: OutputType): string => {
    setCurrentType(newType);
    return formatOutput(content, newType);
  }, []);

  /**
   * Get config for current or specified type
   */
  const getConfig = useCallback((type?: OutputType) => {
    return getOutputTypeConfig(type || currentType);
  }, [currentType]);

  return {
    currentType,
    setCurrentType,
    autoDetectType,
    format,
    validate,
    reformatAs,
    getConfig
  };
}
