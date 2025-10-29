/**
 * Template Engine for Fluxus
 * 
 * Helper Usage:
 * - {{ upper(text) }} - Convert text to uppercase
 * - {{ title(text) }} - Convert text to title case
 * - {{ clamp(text, maxChars) }} - Truncate text to maxChars with ellipsis
 * - {{ bullets(input, maxItems?) }} - Convert text/array to bullet points
 * - {{ or(a, b) }} - Return first truthy value, fallback to second
 * 
 * Path Resolution:
 * - {{ summaries.technical }} - Access nested object properties
 * - Missing values render as "[TBD]"
 * - Unknown tokens render as "[UNKNOWN: token]"
 */

export type Helpers = {
  upper: (text: string) => string;
  title: (text: string) => string;
  clamp: (text: string, maxChars: number) => string;
  bullets: (input: string | string[], maxItems?: number) => string;
  or: <T>(a: T, b: T) => T;
};

export const defaultHelpers: Helpers = {
  upper: (text: string) => String(text || '').toUpperCase(),
  
  title: (text: string) => {
    return String(text || '')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  clamp: (text: string, maxChars: number) => {
    const str = String(text || '');
    if (str.length <= maxChars) return str;
    return str.slice(0, maxChars - 3) + '...';
  },
  
  bullets: (input: string | string[], maxItems?: number) => {
    let items: string[];
    
    if (Array.isArray(input)) {
      items = input.filter(Boolean);
    } else {
      const text = String(input || '');
      // Split on newlines or periods, clean up
      items = text
        .split(/[\n.]/)
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    if (maxItems && items.length > maxItems) {
      items = items.slice(0, maxItems);
    }
    
    return items.map(item => `- ${item}`).join('\n');
  },
  
  or: <T>(a: T, b: T): T => {
    return a || b;
  }
};

export interface TemplateContext {
  meta: {
    featureName?: string;
    status?: "beta" | "ga" | "flagged" | "tbd";
    access?: string;
    audienceNotes?: string;
    productArea?: string[];
    version?: string;
  };
  summaries: {
    technical: string;
    value: string;
  };
  links: {
    prUrl?: string;
    linearUrl?: string;
    docsUrl?: string;
  };
  metrics: {
    kpi?: string;
  };
  notes: string;
}

export type CompileResult = { 
  text: string; 
  unknownTokens: string[] 
};

/**
 * Safely resolve a path in an object
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

/**
 * Compile a template string with context and helpers
 */
export function compile(
  template: string, 
  ctx: TemplateContext, 
  helpers: Helpers = defaultHelpers
): string {
  // Match {{ ... }} tokens
  const tokenRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  
  return template.replace(tokenRegex, (match, expression) => {
    try {
      // Handle helper functions: helperName(arg1, arg2, ...)
      const helperMatch = expression.match(/^(\w+)\((.*)\)$/);
      
      if (helperMatch) {
        const [, helperName, argsStr] = helperMatch;
        const helper = helpers[helperName as keyof Helpers];
        
        if (!helper) {
          return `[UNKNOWN: ${helperName}]`;
        }
        
        // Parse arguments (simple comma split, no nested parentheses)
        const args = argsStr
          .split(',')
          .map(arg => arg.trim())
          .map(arg => {
            // Remove quotes if present
            if ((arg.startsWith('"') && arg.endsWith('"')) || 
                (arg.startsWith("'") && arg.endsWith("'"))) {
              return arg.slice(1, -1);
            }
            // Resolve path if it looks like a path
            if (arg.match(/^[a-zA-Z][a-zA-Z0-9_.]*$/)) {
              return resolvePath(ctx, arg);
            }
            return arg;
          });
        
        const result = helper(...args);
        return String(result || '[TBD]');
      }
      
      // Handle simple path resolution: summaries.technical
      const value = resolvePath(ctx, expression);
      
      if (value === undefined || value === null || value === '') {
        return '[TBD]';
      }
      
      return String(value);
      
    } catch (error) {
      console.warn(`Template compilation error for "${expression}":`, error);
      return `[UNKNOWN: ${expression}]`;
    }
  });
}

/**
 * Compile a template string with context and helpers, returning diagnostics
 */
export function compileWithDiagnostics(
  template: string, 
  ctx: TemplateContext, 
  helpers: Helpers = defaultHelpers
): CompileResult {
  const unknownTokens: string[] = [];
  
  // Match {{ ... }} tokens
  const tokenRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  
  const text = template.replace(tokenRegex, (match, expression) => {
    try {
      // Handle helper functions: helperName(arg1, arg2, ...)
      const helperMatch = expression.match(/^(\w+)\((.*)\)$/);
      
      if (helperMatch) {
        const [, helperName, argsStr] = helperMatch;
        const helper = helpers[helperName as keyof Helpers];
        
        if (!helper) {
          unknownTokens.push(helperName);
          return `[UNKNOWN: ${helperName}]`;
        }
        
        // Parse arguments (simple comma split, no nested parentheses)
        const args = argsStr
          .split(',')
          .map(arg => arg.trim())
          .map(arg => {
            // Remove quotes if present
            if ((arg.startsWith('"') && arg.endsWith('"')) || 
                (arg.startsWith("'") && arg.endsWith("'"))) {
              return arg.slice(1, -1);
            }
            // Resolve path if it looks like a path
            if (arg.match(/^[a-zA-Z][a-zA-Z0-9_.]*$/)) {
              return resolvePath(ctx, arg);
            }
            return arg;
          });
        
        const result = helper(...args);
        return String(result || '[TBD]');
      }
      
      // Handle simple path resolution: summaries.technical
      const value = resolvePath(ctx, expression);
      
      if (value === undefined || value === null || value === '') {
        return '[TBD]';
      }
      
      return String(value);
      
    } catch (error) {
      console.warn(`Template compilation error for "${expression}":`, error);
      unknownTokens.push(expression);
      return `[UNKNOWN: ${expression}]`;
    }
  });
  
  return { text, unknownTokens };
}
