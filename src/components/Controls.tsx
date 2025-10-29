'use client';

import { useState } from 'react';
import { Audience } from '@/types/audience';

interface ControlsProps {
  onSummarize: () => Promise<void>;
  onGenerateDrafts: () => Promise<void>;
  onRegenerate: (audience?: Audience) => Promise<void>;
  onTemplates: () => void;
  onMissingInfo: () => void;
  isLoading?: boolean;
  currentTab?: Audience;
  isCurrentTabLocked?: boolean;
  status?: {
    lastSummarized?: string;
    lastGenerated: Record<Audience, string>;
  };
  missingInfoCount?: number;
}

export default function Controls({ 
  onSummarize, 
  onGenerateDrafts, 
  onRegenerate,
  onTemplates,
  onMissingInfo,
  isLoading = false,
  currentTab,
  isCurrentTabLocked = false,
  status,
  missingInfoCount = 0
}: ControlsProps) {
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);

  const handleSummarize = async () => {
    try {
      await onSummarize();
    } catch (error) {
      console.error('Summarize failed:', error);
    }
  };

  const handleGenerateDrafts = async () => {
    try {
      await onGenerateDrafts();
    } catch (error) {
      console.error('Generate drafts failed:', error);
    }
  };

  const handleRegenerateClick = async () => {
    if (currentTab && !isCurrentTabLocked) {
      try {
        await onRegenerate(currentTab);
      } catch (error) {
        console.error('Regenerate failed:', error);
      }
    } else {
      setShowRegenerateDropdown(!showRegenerateDropdown);
    }
  };

  const handleRegenerateAll = async () => {
    try {
      await onRegenerate();
      setShowRegenerateDropdown(false);
    } catch (error) {
      console.error('Regenerate all failed:', error);
    }
  };

  const handleRegenerateCurrent = async () => {
    if (currentTab) {
      try {
        await onRegenerate(currentTab);
        setShowRegenerateDropdown(false);
      } catch (error) {
        console.error('Regenerate current failed:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={handleSummarize}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Processing...' : 'Summarize'}
          </button>
          
          <button
            onClick={handleGenerateDrafts}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Generate Drafts
          </button>
          
          <div className="relative">
            <button
              onClick={handleRegenerateClick}
              disabled={isLoading || isCurrentTabLocked}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-1"
            >
              <span>Regenerate</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showRegenerateDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleRegenerateCurrent}
                  disabled={isCurrentTabLocked}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate Current Tab
                </button>
                <button
                  onClick={handleRegenerateAll}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Regenerate All Tabs
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onMissingInfo}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg flex items-center space-x-1"
          >
            <span>Missing info</span>
            {missingInfoCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                {missingInfoCount}
              </span>
            )}
          </button>
          
          <button
            onClick={onTemplates}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg"
          >
            Templates
          </button>
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              <span>Generating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Line */}
      {status && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            {status.lastSummarized && (
              <span>Last summarized: {status.lastSummarized}</span>
            )}
            {Object.entries(status.lastGenerated).map(([audience, time]) => 
              time ? (
                <span key={audience}>
                  Last {audience}: {time}
                </span>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}