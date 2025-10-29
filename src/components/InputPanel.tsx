'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { EditorState, EditorActions } from '@/types/context';

interface InputPanelProps {
  state: EditorState;
  actions: EditorActions;
}

export interface InputPanelRef {
  focusByKey: (key: string) => void;
}

const InputPanel = forwardRef<InputPanelRef, InputPanelProps>(({ state, actions }, ref) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});

  useImperativeHandle(ref, () => ({
    focusByKey: (key: string) => {
      const element = inputRefs.current[key];
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }));

  const handleGitHubPRChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    actions.setManualInput({ prText: e.target.value });
  };

  const handleLinearTicketChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    actions.setManualInput({ ticketText: e.target.value });
  };

  const handleMetaChange = (field: keyof EditorState['meta'], value: string | string[] | undefined) => {
    actions.setMeta({ [field]: value });
  };

  const handleProductAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const areas = e.target.value.split(',').map(area => area.trim()).filter(Boolean);
    actions.setMeta({ productArea: areas.length > 0 ? areas : undefined });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Input Sources</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Paste your GitHub PR and Linear ticket content below
        </p>
      </div>
      
      <div className="flex-1 p-6 space-y-6">
        <div>
          <label htmlFor="github-pr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub PR
          </label>
          <textarea
            id="github-pr"
            value={state.manualInput.prText}
            onChange={handleGitHubPRChange}
            placeholder="Paste GitHub PR description, comments, and commit messages here..."
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
          />
        </div>
        
        <div>
          <label htmlFor="linear-ticket" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Linear Ticket
          </label>
          <textarea
            id="linear-ticket"
            value={state.manualInput.ticketText}
            onChange={handleLinearTicketChange}
            placeholder="Paste Linear ticket description, comments, and related information here..."
            className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
          />
        </div>

        {/* Meta Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Meta Information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="feature-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Feature Name
              </label>
              <input
                id="feature-name"
                type="text"
                value={state.meta.featureName ?? ''}
                onChange={(e) => handleMetaChange('featureName', e.target.value || undefined)}
                placeholder="Enter feature name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={state.meta.status || ''}
                onChange={(e) => handleMetaChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select status...</option>
                <option value="beta">Beta</option>
                <option value="ga">GA</option>
                <option value="flagged">Flagged</option>
                <option value="tbd">TBD</option>
              </select>
            </div>

            <div>
              <label htmlFor="access" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access
              </label>
              <input
                ref={(el) => { inputRefs.current['meta.access'] = el; }}
                id="access"
                type="text"
                value={state.meta.access ?? ''}
                onChange={(e) => handleMetaChange('access', e.target.value || undefined)}
                placeholder="e.g., Public, Private, Beta users..."
                title="How users enable/see this feature"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Version
              </label>
              <input
                id="version"
                type="text"
                value={state.meta.version ?? ''}
                onChange={(e) => handleMetaChange('version', e.target.value || undefined)}
                placeholder="e.g., v2.1.0..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="product-area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Area
              </label>
              <input
                id="product-area"
                type="text"
                value={state.meta.productArea?.join(', ') ?? ''}
                onChange={handleProductAreaChange}
                placeholder="e.g., Authentication, Dashboard, API..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="audience-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audience Notes
              </label>
              <textarea
                ref={(el) => { inputRefs.current['meta.audienceNotes'] = el; }}
                id="audience-notes"
                value={state.meta.audienceNotes ?? ''}
                onChange={(e) => handleMetaChange('audienceNotes', e.target.value || undefined)}
                placeholder="Additional notes for different audiences..."
                title="Who can use this feature and any restrictions"
                className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Links</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="pr-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PR URL
              </label>
              <input
                ref={(el) => { inputRefs.current['links.prUrl'] = el; }}
                id="pr-url"
                type="url"
                value={state.links.prUrl ?? ''}
                onChange={(e) => actions.setLinks({ prUrl: e.target.value || undefined })}
                placeholder="https://github.com/repo/pull/123"
                title="Link to the pull request"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="linear-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Linear URL
              </label>
              <input
                ref={(el) => { inputRefs.current['links.linearUrl'] = el; }}
                id="linear-url"
                type="url"
                value={state.links.linearUrl ?? ''}
                onChange={(e) => actions.setLinks({ linearUrl: e.target.value || undefined })}
                placeholder="https://linear.app/issue/ABC-456"
                title="Link to the Linear ticket"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="docs-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Docs URL
              </label>
              <input
                id="docs-url"
                type="url"
                value={state.links.docsUrl ?? ''}
                onChange={(e) => actions.setLinks({ docsUrl: e.target.value || undefined })}
                placeholder="https://docs.example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Metrics</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="kpi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                KPI / Expected Impact
              </label>
              <input
                ref={(el) => { inputRefs.current['metrics.kpi'] = el; }}
                id="kpi"
                type="text"
                value={state.metrics.kpi ?? ''}
                onChange={(e) => actions.setMetrics({ kpi: e.target.value || undefined })}
                placeholder="e.g., 50% reduction in login time"
                title="Key performance indicators or success metrics"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Notes</h3>
          <div>
              <textarea
                ref={(el) => { inputRefs.current['notes'] = el; }}
                value={state.notes ?? ''}
                onChange={(e) => actions.setNotes(e.target.value)}
                placeholder="Additional notes and context..."
                title="Any additional context or notes"
                className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
          </div>
        </div>
      </div>
    </div>
  );
});

InputPanel.displayName = 'InputPanel';

export default InputPanel;
