'use client';

import { useState, useEffect, useCallback } from 'react';
import { Audience } from '@/types/audience';
import { EditorState, EditorActions } from '@/types/context';
import { getDefaultTemplates } from '@/lib/defaultTemplates';
import { TemplateContext } from '@/lib/templateEngine';
import { buildContext } from '@/utils/buildContext';
import { scanTBD, scanUnknownTokens, MissingItem } from '@/utils/scanMissing';

const STORAGE_KEY = 'fluxus:editor';
const TEMPLATES_STORAGE_KEY = 'fluxus:templates';

const defaultState: EditorState = {
  manualInput: {
    prText: '',
    ticketText: '',
  },
  meta: {
    featureName: undefined,
    status: undefined,
    access: undefined,
    audienceNotes: undefined,
    productArea: undefined,
    version: undefined,
  },
  summaries: {
    technical: '',
    value: '',
  },
  links: {
    prUrl: undefined,
    linearUrl: undefined,
    docsUrl: undefined,
  },
  metrics: {
    kpi: undefined,
  },
  notes: '',
  drafts: {
    internal: '',
    customer: '',
    investor: '',
    public: '',
  },
  locks: {
    internal: false,
    customer: false,
    investor: false,
    public: false,
  },
  templates: getDefaultTemplates(),
  status: {
    lastSummarized: undefined,
    lastGenerated: {
      internal: '',
      customer: '',
      investor: '',
      public: '',
    },
  },
  diagnostics: {
    internal: { missing: [], unknownTokens: [] },
    customer: { missing: [], unknownTokens: [] },
    investor: { missing: [], unknownTokens: [] },
    public: { missing: [], unknownTokens: [] },
  },
};

export function useEditorState() {
  const [state, setState] = useState<EditorState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Debounced save to localStorage
  const saveToStorage = useCallback(
    debounce((currentState: EditorState) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }, 500),
    []
  );

  // Debounced save templates to localStorage
  const saveTemplatesToStorage = useCallback(
    debounce((templates: EditorState['templates']) => {
      try {
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
      } catch (error) {
        console.warn('Failed to save templates to localStorage:', error);
      }
    }, 500),
    []
  );

  // Normalize state by converting empty strings to undefined for optional fields
  const normalizeState = (state: Partial<EditorState>): EditorState => {
    const normalized = { ...defaultState, ...state };
    
    if (normalized.meta) {
      normalized.meta = {
        featureName: normalized.meta.featureName || undefined,
        status: normalized.meta.status || undefined,
        access: normalized.meta.access || undefined,
        audienceNotes: normalized.meta.audienceNotes || undefined,
        productArea: (normalized.meta.productArea && normalized.meta.productArea.length > 0) ? normalized.meta.productArea : undefined,
        version: normalized.meta.version || undefined,
      };
    }
    
    if (normalized.links) {
      normalized.links = {
        prUrl: normalized.links.prUrl || undefined,
        linearUrl: normalized.links.linearUrl || undefined,
        docsUrl: normalized.links.docsUrl || undefined,
      };
    }
    
    if (normalized.metrics) {
      normalized.metrics = {
        kpi: normalized.metrics.kpi || undefined,
      };
    }
    
    return normalized;
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      
      let loadedState = defaultState;
      
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Merge with defaults to handle schema changes
        loadedState = {
          ...defaultState,
          ...parsedState,
          // Ensure nested objects are properly merged
          manualInput: { ...defaultState.manualInput, ...parsedState.manualInput },
          meta: { ...defaultState.meta, ...parsedState.meta },
          summaries: { ...defaultState.summaries, ...parsedState.summaries },
          links: { ...defaultState.links, ...parsedState.links },
          metrics: { ...defaultState.metrics, ...parsedState.metrics },
          drafts: { ...defaultState.drafts, ...parsedState.drafts },
          locks: { ...defaultState.locks, ...parsedState.locks },
        };
      }
      
      // Normalize the state to convert empty strings to undefined
      loadedState = normalizeState(loadedState);
      
      // Load templates separately
      if (storedTemplates) {
        const parsedTemplates = JSON.parse(storedTemplates);
        loadedState.templates = { ...defaultState.templates, ...parsedTemplates };
      }
      
      setState(loadedState);
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever state changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      // Save main state (excluding templates)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { templates: _templates, ...stateWithoutTemplates } = state;
      saveToStorage(stateWithoutTemplates as EditorState);
    }
  }, [state, isHydrated, saveToStorage]);

  // Save templates separately when they change
  useEffect(() => {
    if (isHydrated) {
      saveTemplatesToStorage(state.templates);
    }
  }, [state.templates, isHydrated, saveTemplatesToStorage]);

  const actions: EditorActions = {
    setManualInput: useCallback((partial) => {
      setState(prev => ({
        ...prev,
        manualInput: { ...prev.manualInput, ...partial },
      }));
    }, []),

    setMeta: useCallback((partial) => {
      setState(prev => ({
        ...prev,
        meta: { ...prev.meta, ...partial },
      }));
    }, []),

    setSummaries: useCallback((partial) => {
      setState(prev => ({
        ...prev,
        summaries: { ...prev.summaries, ...partial },
      }));
    }, []),

    setDraft: useCallback((audience: Audience, text: string) => {
      setState(prev => {
        // Update diagnostics when draft changes
        const missing = scanTBD(text, audience);
        const unknownTokens = scanUnknownTokens(text);
        
        return {
          ...prev,
          drafts: { ...prev.drafts, [audience]: text },
          diagnostics: {
            ...prev.diagnostics,
            [audience]: { missing, unknownTokens },
          },
        };
      });
    }, []),

    toggleLock: useCallback((audience: Audience) => {
      setState(prev => ({
        ...prev,
        locks: { ...prev.locks, [audience]: !prev.locks[audience] },
      }));
    }, []),

    setLinks: useCallback((partial) => {
      setState(prev => ({
        ...prev,
        links: { ...prev.links, ...partial },
      }));
    }, []),

    setMetrics: useCallback((partial) => {
      setState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, ...partial },
      }));
    }, []),

    setNotes: useCallback((notes: string) => {
      setState(prev => ({
        ...prev,
        notes,
      }));
    }, []),

    setTemplate: useCallback((audience: Audience, template) => {
      setState(prev => ({
        ...prev,
        templates: { ...prev.templates, [audience]: template },
      }));
    }, []),

    resetTemplate: useCallback((audience: Audience) => {
      setState(prev => ({
        ...prev,
        templates: { ...prev.templates, [audience]: getDefaultTemplates()[audience] },
      }));
    }, []),

    getTemplateContext: useCallback((): TemplateContext => {
      return buildContext(state);
    }, [state]),

    summarize: useCallback(async () => {
      try {
        // Deterministic extraction from PR text and ticket text
        const prText = state.manualInput.prText || '';
        const ticketText = state.manualInput.ticketText || '';
        
        // Extract technical summary from PR text
        // Split into sentences, take first 3 that contain change keywords
        const lines = prText
          .split(/[.!?]+\s+/)
          .map(s => s.trim())
          .filter(Boolean);
        
        const changeKeywords = [
          'changed', 'added', 'updated', 'removed', 'refactor', 'fix', 'fixed',
          'endpoint', 'route', 'component', 'schema', 'implemented', 'created',
          'modified', 'replaced', 'improved', 'enhanced', 'optimized'
        ];
        
        const relevantLines = lines.filter(line => {
          const lower = line.toLowerCase();
          return changeKeywords.some(keyword => lower.includes(keyword));
        }).slice(0, 3);
        
        const technical = relevantLines.length > 0 
          ? relevantLines.join('\n') 
          : '[TBD]';
        
        // Extract value summary from ticket text (truncate to 280 chars)
        const value = ticketText.trim().slice(0, 280) || '[TBD]';
        
        setState(prev => ({
          ...prev,
          summaries: {
            technical,
            value,
          },
          status: {
            ...prev.status,
            lastSummarized: new Date().toLocaleTimeString(),
          },
        }));
      } catch (error) {
        console.error('Summarize error:', error);
        throw error;
      }
    }, [state.manualInput.prText, state.manualInput.ticketText]),

    generateOne: useCallback(async (audience: Audience) => {
      try {
        const context = buildContext(state);
        const template = state.templates[audience];

        // Compile the template directly
        const { compileWithDiagnostics } = await import('@/lib/templateEngine');
        const result = compileWithDiagnostics(template.body, context);
        
        // Enforce length limit
        let finalText = result.text;
        if (finalText.length > template.lengthLimit) {
          finalText = finalText.slice(0, template.lengthLimit - 3) + '...';
        }
        
        setState(prev => {
          // Update diagnostics when draft changes
          const missing = scanTBD(finalText, audience);
          const unknownTokens = result.unknownTokens || [];
          
          return {
            ...prev,
            drafts: {
              ...prev.drafts,
              [audience]: finalText,
            },
            diagnostics: {
              ...prev.diagnostics,
              [audience]: { missing, unknownTokens },
            },
            status: {
              ...prev.status,
              lastGenerated: {
                ...prev.status.lastGenerated,
                [audience]: new Date().toLocaleTimeString(),
              },
            },
          };
        });

        // Return warnings if any
        if (result.unknownTokens.length > 0) {
          console.warn(`Unknown tokens in ${audience} template: ${result.unknownTokens.join(', ')}`);
        }
      } catch (error) {
        console.error('Generate error:', error);
        throw error;
      }
    }, [state]),

    generateAll: useCallback(async () => {
      const audiences: Audience[] = ['internal', 'customer', 'investor', 'public'];
      const unlockedAudiences = audiences.filter(audience => !state.locks[audience]);
      
      // Compile templates directly for each unlocked audience
      const { compileWithDiagnostics } = await import('@/lib/templateEngine');
      const context = buildContext(state);
      
      for (const audience of unlockedAudiences) {
        try {
          const template = state.templates[audience];
          const result = compileWithDiagnostics(template.body, context);
          
          // Enforce length limit
          let finalText = result.text;
          if (finalText.length > template.lengthLimit) {
            finalText = finalText.slice(0, template.lengthLimit - 3) + '...';
          }
          
          setState(prev => {
            // Update diagnostics when draft changes
            const missing = scanTBD(finalText, audience);
            const unknownTokens = result.unknownTokens || [];
            
            return {
              ...prev,
              drafts: {
                ...prev.drafts,
                [audience]: finalText,
              },
              diagnostics: {
                ...prev.diagnostics,
                [audience]: { missing, unknownTokens },
              },
              status: {
                ...prev.status,
                lastGenerated: {
                  ...prev.status.lastGenerated,
                  [audience]: new Date().toLocaleTimeString(),
                },
              },
            };
          });
        } catch (error) {
          console.error(`Generate error for ${audience}:`, error);
        }
      }
    }, [state]),

    // Diagnostics selectors
    getAllMissing: useCallback((): MissingItem[] => {
      const allMissing: MissingItem[] = [];
      const seenKeys = new Set<string>();
      
      Object.values(state.diagnostics).forEach(diagnostic => {
        diagnostic.missing.forEach(item => {
          const key = `${item.key}-${item.audience || 'global'}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            allMissing.push(item);
          }
        });
      });
      
      return allMissing;
    }, [state.diagnostics]),

    getWarnings: useCallback((): string[] => {
      const warnings: string[] = [];
      
      Object.entries(state.diagnostics).forEach(([audience, diagnostic]) => {
        if (diagnostic.unknownTokens.length > 0) {
          warnings.push(`Unknown tokens in ${audience} template: ${diagnostic.unknownTokens.join(', ')}`);
        }
      });
      
      return warnings;
    }, [state.diagnostics]),

    getDiagnosticsForAudience: useCallback((audience: Audience) => {
      return state.diagnostics[audience];
    }, [state.diagnostics]),
  };

  return {
    state,
    actions,
    isHydrated,
  };
}

// Simple debounce utility
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
