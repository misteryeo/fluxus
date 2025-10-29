import { Audience } from './audience';
import { TemplateContext } from '@/lib/templateEngine';
import { MissingItem } from '@/utils/scanMissing';

export interface EditorState {
  manualInput: {
    prText: string;
    ticketText: string;
  };
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
  drafts: Record<Audience, string>;
  locks: Record<Audience, boolean>;
  templates: Record<Audience, {
    name: string;
    body: string;
    tone: "neutral" | "friendly" | "assertive";
    lengthLimit: number;
    emoji?: boolean;
  }>;
  status: {
    lastSummarized?: string;
    lastGenerated: Record<Audience, string>;
  };
  diagnostics: Record<Audience, {
    missing: MissingItem[];
    unknownTokens: string[];
  }>;
}

export interface EditorActions {
  setManualInput: (partial: Partial<EditorState['manualInput']>) => void;
  setMeta: (partial: Partial<EditorState['meta']>) => void;
  setSummaries: (partial: Partial<EditorState['summaries']>) => void;
  setLinks: (partial: Partial<EditorState['links']>) => void;
  setMetrics: (partial: Partial<EditorState['metrics']>) => void;
  setNotes: (notes: string) => void;
  setDraft: (audience: Audience, text: string) => void;
  toggleLock: (audience: Audience) => void;
  setTemplate: (audience: Audience, template: EditorState['templates'][Audience]) => void;
  resetTemplate: (audience: Audience) => void;
  getTemplateContext: () => TemplateContext;
  summarize: () => Promise<void>;
  generateOne: (audience: Audience) => Promise<void>;
  generateAll: () => Promise<void>;
  // Diagnostics selectors
  getAllMissing: () => MissingItem[];
  getWarnings: () => string[];
  getDiagnosticsForAudience: (audience: Audience) => EditorState['diagnostics'][Audience];
}
