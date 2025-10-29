import { TemplateContext } from '@/lib/templateEngine';
import { EditorState } from '@/types/context';

/**
 * Builds a TemplateContext from the current editor state
 */
export function buildContext(state: EditorState): TemplateContext {
  return {
    meta: {
      featureName: state.meta.featureName || undefined,
      status: state.meta.status || undefined,
      access: state.meta.access || undefined,
      audienceNotes: state.meta.audienceNotes || undefined,
      productArea: (state.meta.productArea && state.meta.productArea.length > 0) ? state.meta.productArea : undefined,
      version: state.meta.version || undefined,
    },
    summaries: {
      technical: state.summaries.technical || '',
      value: state.summaries.value || '',
    },
    links: {
      prUrl: state.links.prUrl || undefined,
      linearUrl: state.links.linearUrl || undefined,
      docsUrl: state.links.docsUrl || undefined,
    },
    metrics: {
      kpi: state.metrics.kpi || undefined,
    },
    notes: state.notes || '',
  };
}
