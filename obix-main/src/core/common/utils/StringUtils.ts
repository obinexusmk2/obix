/**
 * Utility functions for string manipulation and optimization
 */

/**
 * String interning cache for memory optimization
 */
const STRING_INTERN_CACHE = new Map<string, string>();
const MAX_CACHE_SIZE = 10000;

/**
 * Intern a string to reduce memory usage by sharing identical strings
 * 
 * @param str String to intern
 * @returns Interned string
 */
export function internString(str: string): string {
  if (STRING_INTERN_CACHE.has(str)) {
    return STRING_INTERN_CACHE.get(str)!;
  }
  
  // Limit cache size to prevent memory leaks
  if (STRING_INTERN_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = STRING_INTERN_CACHE.keys().next().value;
    STRING_INTERN_CACHE.delete(oldestKey);
  }
  
  STRING_INTERN_CACHE.set(str, str);
  return str;
}

/**
 * Generate a unique ID string
 * 
 * @param prefix Optional prefix for the ID
 * @param length Length of the random part (default: 8)
 * @returns Unique ID string
 */
export function generateId(prefix?: string, length: number = 8): string {
  const randomPart = Math.random().toString(36).substring(2, 2 + length);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

/**
 * Validate that a string meets requirements for a state ID
 * 
 * @param id String to validate
 * @returns True if the string is a valid state ID
 */
export function isValidStateId(id: string): boolean {
  // State IDs must be non-empty strings containing only alphanumeric
  // characters, underscores, and hyphens
  return typeof id === 'string' && 
         id.length > 0 && 
         /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Format a state ID according to conventions
 * 
 * @param id State ID to format
 * @returns Formatted state ID
 */
export function formatStateId(id: string): string {
  // Replace spaces and invalid characters with underscores
  return id.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Create a transition key from state ID and input symbol
 * 
 * @param stateId Source state ID
 * @param inputSymbol Input symbol
 * @returns Transition key string
 */
export function createTransitionKey(stateId: string, inputSymbol: string): string {
  return `${stateId}:${inputSymbol}`;
}

/**
 * Parse a transition key into state ID and input symbol
 * 
 * @param key Transition key
 * @returns Object with stateId and inputSymbol
 */
export function parseTransitionKey(key: string): { stateId: string; inputSymbol: string } {
  const [stateId, inputSymbol] = key.split(':');
  return { stateId, inputSymbol };
}

/**
 * Calculate string similarity using Levenshtein distance
 * Useful for finding similar state or transition names
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (0-1, where 1 is identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,          // deletion
        matrix[i][j - 1] + 1,          // insertion
        matrix[i - 1][j - 1] + cost    // substitution
      );
    }
  }
  
  const distance = matrix[str1.length][str2.length];
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1.0 - (distance / maxLength);
}

/**
 * Truncate a string to a maximum length with ellipsis
 * 
 * @param str String to truncate
 * @param maxLength Maximum length
 * @param ellipsis Ellipsis string (default: '...')
 * @returns Truncated string
 */
export function truncateString(
  str: string,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  const ellipsisLength = ellipsis.length;
  const truncatedLength = maxLength - ellipsisLength;
  
  if (truncatedLength <= 0) {
    return ellipsis.substring(0, maxLength);
  }
  
  return str.substring(0, truncatedLength) + ellipsis;
}

/**
 * Create a hash for a string (faster than object hashCode)
 * 
 * @param str String to hash
 * @returns Hash code
 */
export function stringHash(str: string): number {
  let hash = 0;
  
  if (str.length === 0) {
    return hash;
  }
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  return hash;
}

/**
 * Check if a string contains another string, case insensitive
 * 
 * @param str String to search in
 * @param searchStr String to search for
 * @returns True if the string contains the search string
 */
export function containsIgnoreCase(str: string, searchStr: string): boolean {
  return str.toLowerCase().includes(searchStr.toLowerCase());
}

/**
 * Convert camelCase or PascalCase to kebab-case
 * 
 * @param str String to convert
 * @returns Kebab case string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert kebab-case or snake_case to camelCase
 * 
 * @param str String to convert
 * @returns Camel case string
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Convert kebab-case or snake_case to PascalCase
 * 
 * @param str String to convert
 * @returns Pascal case string
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Escape special regex characters in a string
 * 
 * @param str String to escape
 * @returns Escaped string safe for regex
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format a string template with named variables
 * 
 * @param template Template string with {variable} placeholders
 * @param variables Object with variable values
 * @returns Formatted string
 */
export function formatTemplate(
  template: string,
  variables: Record<string, any>
): string {
  return template.replace(/{([^{}]*)}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}