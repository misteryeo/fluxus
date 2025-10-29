import { Audience } from '@/types/audience';

export type MissingItem = { 
  key: string; 
  label: string; 
  audience?: Audience; 
  hint?: string; 
};

/**
 * Maps TBD hints to field keys
 */
const TBD_HINT_MAP: Record<string, string> = {
  'how to access': 'meta.access',
  'access': 'meta.access',
  'audience': 'meta.audienceNotes',
  'audience notes': 'meta.audienceNotes',
  'eligibility': 'meta.audienceNotes',
  'kpi': 'metrics.kpi',
  'kpis': 'metrics.kpi',
  'metric': 'metrics.kpi',
  'metrics': 'metrics.kpi',
  'impact': 'metrics.kpi',
  'pr': 'links.prUrl',
  'pr url': 'links.prUrl',
  'pull request': 'links.prUrl',
  'linear': 'links.linearUrl',
  'linear url': 'links.linearUrl',
  'ticket': 'links.linearUrl',
  'docs': 'links.docsUrl',
  'documentation': 'links.docsUrl',
  'notes': 'notes',
  'additional notes': 'notes',
};

/**
 * Field labels for display
 */
const FIELD_LABELS: Record<string, string> = {
  'meta.access': 'Access instructions',
  'meta.audienceNotes': 'Audience eligibility',
  'metrics.kpi': 'KPI / leading indicator',
  'links.prUrl': 'PR link',
  'links.linearUrl': 'Linear link',
  'links.docsUrl': 'Documentation link',
  'notes': 'Additional notes',
};

/**
 * Field hints for display
 */
const FIELD_HINTS: Record<string, string> = {
  'meta.access': 'How users enable/see this feature',
  'meta.audienceNotes': 'Who can use this feature and any restrictions',
  'metrics.kpi': 'Key performance indicators or success metrics',
  'links.prUrl': 'Link to the pull request',
  'links.linearUrl': 'Link to the Linear ticket',
  'links.docsUrl': 'Link to relevant documentation',
  'notes': 'Any additional context or notes',
};

/**
 * Scans text for [TBD ...] patterns and returns missing items
 */
export function scanTBD(text: string, audience: Audience): MissingItem[] {
  const missingItems: MissingItem[] = [];
  
  // Pattern to match [TBD: hint] or [TBD hint]
  // Note: We only report missing items when there's a hint, not standalone [TBD]
  const tbdRegex = /\[TBD(?:\s*:\s*([^\]]+))\]/gi;
  
  let match;
  while ((match = tbdRegex.exec(text)) !== null) {
    const hint = match[1]?.toLowerCase().trim();
    
    if (!hint) {
      continue; // Skip standalone [TBD] without hints
    }
    
    // Determine the field key based on hint
    let key: string;
    if (TBD_HINT_MAP[hint]) {
      key = TBD_HINT_MAP[hint];
    } else {
      // Try partial matches
      const partialMatch = Object.keys(TBD_HINT_MAP).find(k => 
        hint.includes(k) || k.includes(hint)
      );
      key = partialMatch ? TBD_HINT_MAP[partialMatch] : 'notes';
    }
    
    // Check if we already have this key for this audience
    const existingItem = missingItems.find(item => item.key === key && item.audience === audience);
    if (!existingItem) {
      missingItems.push({
        key,
        label: FIELD_LABELS[key] || 'Unknown field',
        audience,
        hint: FIELD_HINTS[key],
      });
    }
  }
  
  return missingItems;
}

/**
 * Scans text for unknown tokens like [UNKNOWN: token] and returns them
 */
export function scanUnknownTokens(text: string): string[] {
  const unknownTokens: string[] = [];
  
  // Pattern to match [UNKNOWN: token]
  const unknownRegex = /\[UNKNOWN:\s*([^\]]+)\]/gi;
  
  let match;
  while ((match = unknownRegex.exec(text)) !== null) {
    const token = match[1].trim();
    if (!unknownTokens.includes(token)) {
      unknownTokens.push(token);
    }
  }
  
  return unknownTokens;
}
