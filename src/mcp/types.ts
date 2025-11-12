/**
 * Result of a theme color change operation
 * Includes both the changes made and accessibility warnings
 */
export interface ThemeChange {
  success: boolean;
  changes: {
    key: string;
    oldValue?: string;
    newValue: string;
    reason: string;
  }[];
  accessibility?: {
    passed: boolean;
    warnings: string[];
    suggestions: string[];
  };
}

/**
 * Information about a specific color key in VSCode
 */
export interface ColorKeyInfo {
  key: string;
  description: string;
  currentValue?: string;
  group: string;
}
