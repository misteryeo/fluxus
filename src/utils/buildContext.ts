import { TemplateContext } from '@/lib/templateEngine';
import { EditorState } from '@/types/context';
import type { PR } from '@/types';

type BuildContextInput = 
  | Partial<EditorState>
  | { prs: PR[]; summary: string; tone?: unknown };

/**
 * Builds a TemplateContext from the current editor state or PRs
 * Handles partial EditorState objects safely, or builds from PRs
 */
export function buildContext(input: BuildContextInput): TemplateContext {
  // Check if input has prs property (new format)
  if ('prs' in input && Array.isArray(input.prs)) {
    return buildContextFromPRs(input.prs, input.summary || '', input.tone);
  }

  // Otherwise treat as EditorState (existing format)
  const state = input as Partial<EditorState>;
  const summaryValue = state.summaries?.value || '';
  return {
    meta: {
      featureName: state.meta?.featureName || undefined,
      status: state.meta?.status || undefined,
      access: state.meta?.access || undefined,
      audienceNotes: state.meta?.audienceNotes || undefined,
      productArea: (state.meta?.productArea && state.meta.productArea.length > 0) ? state.meta.productArea : undefined,
      version: state.meta?.version || undefined,
    },
    summaries: {
      technical: state.summaries?.technical || '',
      value: summaryValue,
    },
    links: {
      prUrl: state.links?.prUrl || undefined,
      linearUrl: state.links?.linearUrl || undefined,
      docsUrl: state.links?.docsUrl || undefined,
    },
    metrics: {
      kpi: state.metrics?.kpi || undefined,
    },
    notes: state.notes || '',
    risks: undefined,
    nextSteps: undefined,
    whyNow: undefined,
    kpis: undefined,
    nextMilestone: undefined,
    whoGetsIt: undefined,
    howToAccess: undefined,
    summary: summaryValue,
    prList: undefined,
    compactPRList: undefined,
    whatChanged: undefined,
    userValue: summaryValue ? transformToCustomerBenefit(summaryValue) : undefined,
    bulletedValue: undefined,
    impactLine: undefined,
  };
}

function buildContextFromPRs(prs: PR[], summary: string, tone?: unknown): TemplateContext {
  const technicalSummary = prs.length > 0
    ? prs.map((pr) => `- #${pr.number}: ${pr.title}`).join('\n')
    : '[TBD]';

  const labels = Array.from(new Set(
    prs.flatMap((pr) => Array.isArray(pr.labels) ? pr.labels.map(l => l.toLowerCase()) : [])
  ));

  const featureName = prs.length > 0
    ? prs.length === 1
      ? prs[0].title?.trim()
      : `${prs[0].title?.trim()} • ${prs[1]?.title?.trim()}${prs.length > 2 ? ` (+${prs.length - 2} more)` : ''}`
    : undefined;

  const productArea = labels
    .map((label) => {
      if (label.startsWith('area:')) return label.replace('area:', '').trim();
      if (label.startsWith('product:')) return label.replace('product:', '').trim();
      return undefined;
    })
    .filter((label): label is string => Boolean(label));

  const status = labels.some(l => l.includes('experimental') || l.includes('alpha') || l.includes('flagged'))
    ? 'flagged' as const
    : labels.some(l => l.includes('beta'))
    ? 'beta' as const
    : labels.some(l => l.includes('ga') || l.includes('general availability'))
    ? 'ga' as const
    : labels.some(l => l.includes('tbd'))
    ? 'tbd' as const
    : undefined;

  const access = labels.some(l => l.includes('internal'))
    ? 'internal only'
    : labels.some(l => l.includes('private'))
    ? 'private preview'
    : labels.some(l => l.includes('public'))
    ? 'public'
    : labels.some(l => l.includes('beta'))
    ? 'beta rollout'
    : undefined;

  const prUrls = prs
    .map((pr) => {
      if (!pr.repo || typeof pr.repo !== 'string' || typeof pr.number !== 'number') return undefined;
      const repoSlug = pr.repo.replace(/^https:\/\/github.com\//, '');
      if (!repoSlug.includes('/')) return undefined;
      return `https://github.com/${repoSlug}/pull/${pr.number}`;
    })
    .filter((url): url is string => Boolean(url));

  const prUrl = prUrls.length === 1
    ? prUrls[0]
    : prUrls.length > 1
    ? prUrls.map((url, i) => `#${prs[i].number} (${prs[i].repo}): ${url}`).join('\n')
    : undefined;

  const notesParts: string[] = [];
  if (prs.length > 0) {
    for (const pr of prs) {
      const author = typeof pr.author?.name === 'string' ? pr.author.name : 'unknown author';
      const risk = pr.riskLevel ? ` | risk: ${pr.riskLevel}` : '';
      notesParts.push(`#${pr.number} — ${pr.title} (${pr.repo}) by ${author}${risk}`);
    }
  }

  if (tone && typeof tone === 'object') {
    const toneEntries = Object.entries(tone as Record<string, unknown>).filter(
      ([, value]) => typeof value === 'string' || typeof value === 'number'
    );
    if (toneEntries.length > 0) {
      notesParts.push(`Preferred tone: ${toneEntries.map(([key, value]) => `${key}: ${value}`).join(', ')}`);
    }
  }

  // Generate enriched tokens
  const summaryValue = summary.trim() || prs.map(pr => pr.title).join(' • ');
  
  const prList = prs.length > 0
    ? prs.map(pr => {
        const author = typeof pr.author?.name === 'string' ? pr.author.name : 'unknown author';
        return `- #${pr.number} – ${pr.title} by ${author}`;
      }).join('\n')
    : '';

  const compactPRList = prs.length > 0
    ? prs.map(pr => `- #${pr.number}: ${pr.title}`).join('\n')
    : '';

  const whatChanged = prs.length > 0
    ? prs.map(pr => pr.title).join(', ')
    : '';

  const userValue = summaryValue
    ? transformToCustomerBenefit(summaryValue)
    : '';

  const bulletedValue = prs.length > 0
    ? prs.slice(0, 3).map(pr => `- ${pr.title}`).join('\n')
    : '';

  const impactLine = generateImpactLine(prs, labels);

  return {
    meta: {
      featureName,
      status,
      access,
      audienceNotes: undefined,
      productArea: productArea.length > 0 ? productArea : undefined,
      version: undefined,
    },
    summaries: {
      technical: technicalSummary,
      value: summary.trim(),
    },
    links: {
      prUrl,
      linearUrl: undefined,
      docsUrl: undefined,
    },
    metrics: {
      kpi: undefined,
    },
    notes: notesParts.join('\n'),
    risks: undefined,
    nextSteps: undefined,
    whyNow: undefined,
    kpis: undefined,
    nextMilestone: undefined,
    whoGetsIt: undefined,
    howToAccess: undefined,
    summary: summaryValue,
    prList,
    compactPRList,
    whatChanged,
    userValue,
    bulletedValue,
    impactLine,
  };
}

function transformToCustomerBenefit(summary: string): string {
  // Simple transformation: make it more customer-focused
  // Remove technical jargon, focus on benefits
  let transformed = summary;
  
  // Common transformations
  transformed = transformed.replace(/adds?/gi, 'enables');
  transformed = transformed.replace(/implements?/gi, 'provides');
  transformed = transformed.replace(/fixes?/gi, 'resolves');
  transformed = transformed.replace(/updates?/gi, 'improves');
  
  // Capitalize first letter
  if (transformed.length > 0) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }
  
  return transformed;
}

function generateImpactLine(prs: PR[], labels: string[]): string {
  const impacts: string[] = [];
  
  // Check for common impact indicators in labels
  if (labels.some(l => l.includes('performance') || l.includes('speed'))) {
    impacts.push('improves performance');
  }
  if (labels.some(l => l.includes('security') || l.includes('vulnerability'))) {
    impacts.push('enhances security');
  }
  if (labels.some(l => l.includes('bug') || l.includes('fix'))) {
    impacts.push('fixes critical issues');
  }
  if (labels.some(l => l.includes('feature') || l.includes('enhancement'))) {
    impacts.push('adds new capabilities');
  }
  if (labels.some(l => l.includes('api') || l.includes('integration'))) {
    impacts.push('enables integrations');
  }
  
  // Count teams/areas affected
  const productAreas = labels.filter(l => l.startsWith('area:') || l.startsWith('product:'));
  if (productAreas.length > 0) {
    impacts.push(`affects ${productAreas.length} ${productAreas.length === 1 ? 'area' : 'areas'}`);
  }
  
  // Fallback based on PR count
  if (impacts.length === 0 && prs.length > 0) {
    if (prs.length === 1) {
      impacts.push('delivers key improvements');
    } else {
      impacts.push(`delivers ${prs.length} improvements`);
    }
  }
  
  return impacts.length > 0 ? impacts.join(' / ') : 'delivers value to users';
}
