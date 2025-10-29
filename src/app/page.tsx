'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import InputPanel, { InputPanelRef } from '@/components/InputPanel';
import OutputTabs from '@/components/OutputTabs';
import Controls from '@/components/Controls';
import TemplateManager from '@/components/TemplateManager';
import { MissingInfo } from '@/components/MissingInfo';
import Toast from '@/components/Toast';
import { useEditorState } from '@/hooks/useEditorState';
import { EditorState } from '@/types/context';
import { Audience } from '@/types/audience';

export default function Home() {
  const { state, actions, isHydrated } = useEditorState();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<Audience>('internal');
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isMissingInfoOpen, setIsMissingInfoOpen] = useState(false);
  const inputPanelRef = useRef<InputPanelRef>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'warning' | 'info' | 'success' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'warning' | 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      await actions.summarize();
      showToast('Summaries generated successfully!', 'success');
    } catch (error) {
      console.error('Summarize failed:', error);
      showToast('Failed to generate summaries. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDrafts = async () => {
    setIsLoading(true);
    try {
      await actions.generateAll();
      
      // Check for missing information using the new diagnostics
      const missingItems = actions.getAllMissing();
      
      if (missingItems.length > 0) {
        showToast('Some fields are missing — open Missing info to see details.', 'warning');
      } else {
        showToast('Drafts generated successfully!', 'success');
      }
    } catch (error) {
      console.error('Generate drafts failed:', error);
      showToast('Failed to generate drafts. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (audience?: Audience) => {
    setIsLoading(true);
    try {
      if (audience) {
        await actions.generateOne(audience);
        showToast(`${audience} draft regenerated successfully!`, 'success');
      } else {
        await actions.generateAll();
        showToast('All drafts regenerated successfully!', 'success');
      }
    } catch (error) {
      console.error('Regenerate failed:', error);
      showToast('Failed to regenerate draft. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplates = () => {
    setIsTemplateManagerOpen(true);
  };

  const handleMissingInfo = () => {
    setIsMissingInfoOpen(true);
  };

  const handleJumpToField = (key: string) => {
    inputPanelRef.current?.focusByKey(key);
    setIsMissingInfoOpen(false);
  };

  const handleSaveTemplate = (audience: Audience, template: EditorState['templates'][Audience]) => {
    actions.setTemplate(audience, template);
  };

  const handleResetTemplate = (audience: Audience) => {
    actions.resetTemplate(audience);
  };

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Controls */}
      <Controls
        onSummarize={handleSummarize}
        onGenerateDrafts={handleGenerateDrafts}
        onRegenerate={handleRegenerate}
        onTemplates={handleTemplates}
        onMissingInfo={handleMissingInfo}
        isLoading={isLoading}
        currentTab={currentTab}
        isCurrentTabLocked={state.locks[currentTab]}
        status={state.status}
        missingInfoCount={actions.getAllMissing().length}
      />
      
      {/* Main Content - Responsive 3-pane layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
        {/* Left Panel - Input */}
        <div className="w-full lg:w-1/2 min-w-0 flex-shrink-0">
          <InputPanel
            ref={inputPanelRef}
            state={state}
            actions={actions}
          />
        </div>
        
        {/* Right Panel - Output */}
        <div className="w-full lg:w-1/2 min-w-0 flex-shrink-0">
          <OutputTabs 
            state={state}
            actions={actions}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
          />
        </div>
      </div>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        templates={state.templates}
        onSaveTemplate={handleSaveTemplate}
        onResetTemplate={handleResetTemplate}
        context={actions.getTemplateContext()}
      />

      {/* Missing Info Modal */}
      {isMissingInfoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Missing Information
              </h2>
              <button
                onClick={() => setIsMissingInfoOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <MissingInfo
                missing={actions.getAllMissing()}
                onJump={handleJumpToField}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
