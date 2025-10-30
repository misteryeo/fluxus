'use client';

import React, { useState } from 'react';
import { Audience } from '@/types/audience';
import { EditorState, EditorActions } from '@/types/context';

interface OutputTabsProps {
  state: EditorState;
  actions: EditorActions;
  currentTab?: Audience;
  onTabChange?: (tab: Audience) => void;
}

export default function OutputTabs({ state, actions, currentTab, onTabChange }: OutputTabsProps) {
  const [activeTab, setActiveTab] = useState<Audience>(currentTab || 'internal');

  // Update activeTab when currentTab prop changes
  React.useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  const handleTabChange = (tab: Audience) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    { id: 'internal' as Audience, label: 'Internal', description: 'Technical details for team' },
    { id: 'customer' as Audience, label: 'Customer', description: 'User-facing features' },
    { id: 'investor' as Audience, label: 'Investor', description: 'Business impact & metrics' },
    { id: 'public' as Audience, label: 'Public', description: 'General announcements' },
  ];

  const handleDraftChange = (audience: Audience, value: string) => {
    actions.setDraft(audience, value);
  };

  const handleLockToggle = (audience: Audience) => {
    actions.toggleLock(audience);
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const getCharacterCountColor = (count: number, limit: number) => {
    if (count > limit) return 'text-red-500';
    if (count > limit * 0.9) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Release Summaries</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generated summaries for different audiences
        </p>
      </div>

      {/* Summaries Editor */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Technical Summary</label>
            <textarea
              value={state.summaries.technical}
              onChange={(e) => actions.setSummaries({ technical: e.target.value })}
              placeholder="Technical changes will appear here after Summarize..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value Summary</label>
            <textarea
              value={state.summaries.value}
              onChange={(e) => actions.setSummaries({ value: e.target.value })}
              placeholder="Customer value will appear here after Summarize..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>{tab.label}</span>
                {state.locks[tab.id] && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {(state.diagnostics[tab.id].missing.length > 0 || state.diagnostics[tab.id].unknownTokens.length > 0) && (
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tabs.find(tab => tab.id === activeTab)?.label} Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Character Counter */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className={getCharacterCountColor(
                getCharacterCount(state.drafts[activeTab]), 
                state.templates[activeTab].lengthLimit
              )}>
                {getCharacterCount(state.drafts[activeTab])}/{state.templates[activeTab].lengthLimit}
              </span>
            </div>
            
            {/* Lock Toggle */}
            <button
              onClick={() => handleLockToggle(activeTab)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                state.locks[activeTab]
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {state.locks[activeTab] ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                )}
              </svg>
              <span>{state.locks[activeTab] ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>
        </div>
        
        <div className="h-full">
          <textarea
            value={state.drafts[activeTab]}
            onChange={(e) => handleDraftChange(activeTab, e.target.value)}
            placeholder={`${tabs.find(tab => tab.id === activeTab)?.label} summary will appear here...`}
            className="w-full h-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
