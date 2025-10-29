'use client';

import React, { useState, useEffect } from 'react';
import { Audience } from '@/types/audience';
import { Template } from '@/lib/defaultTemplates';
import { compileWithDiagnostics, TemplateContext } from '@/lib/templateEngine';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Record<Audience, Template>;
  onSaveTemplate: (audience: Audience, template: Template) => void;
  onResetTemplate: (audience: Audience) => void;
  context: TemplateContext;
}

export default function TemplateManager({
  isOpen,
  onClose,
  templates,
  onSaveTemplate,
  onResetTemplate,
  context
}: TemplateManagerProps) {
  const [selectedAudience, setSelectedAudience] = useState<Audience>('internal');
  const [editingTemplate, setEditingTemplate] = useState<Template>(templates[selectedAudience]);
  const [preview, setPreview] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Update editing template when audience changes
  useEffect(() => {
    setEditingTemplate(templates[selectedAudience]);
  }, [selectedAudience, templates]);

  // Generate preview when template or context changes
  useEffect(() => {
    try {
      const result = compileWithDiagnostics(editingTemplate.body, context);
      setPreview(result.text);
      
      // Set warnings for unknown tokens
      if (result.unknownTokens.length > 0) {
        setWarnings(result.unknownTokens.map(token => `Unknown token: {{${token}}}`));
      } else {
        setWarnings([]);
      }
    } catch (error) {
      setPreview(`Error compiling template: ${error}`);
      setWarnings([]);
    }
  }, [editingTemplate.body, context]);

  const handleSave = () => {
    onSaveTemplate(selectedAudience, editingTemplate);
  };

  const handleReset = () => {
    onResetTemplate(selectedAudience);
  };

  const handleTemplateChange = (field: keyof Template, value: string | number | boolean | undefined) => {
    setEditingTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const audiences: { id: Audience; label: string }[] = [
    { id: 'internal', label: 'Internal' },
    { id: 'customer', label: 'Customer' },
    { id: 'investor', label: 'Investor' },
    { id: 'public', label: 'Public' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Template Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Audience Selection */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Audiences</h3>
              <div className="space-y-1">
                {audiences.map((audience) => (
                  <button
                    key={audience.id}
                    onClick={() => setSelectedAudience(audience.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedAudience === audience.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {audience.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Template Editor */}
          <div className="flex-1 flex flex-col">
            {/* Template Fields */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tone
                  </label>
                  <select
                    value={editingTemplate.tone}
                    onChange={(e) => handleTemplateChange('tone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Friendly</option>
                    <option value="assertive">Assertive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Length Limit
                  </label>
                  <input
                    type="number"
                    value={editingTemplate.lengthLimit}
                    onChange={(e) => handleTemplateChange('lengthLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emoji"
                    checked={editingTemplate.emoji || false}
                    onChange={(e) => handleTemplateChange('emoji', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emoji" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enable Emojis
                  </label>
                </div>
              </div>
            </div>

            {/* Template Body */}
            <div className="flex-1 flex">
              {/* Template Editor */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template Body
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {editingTemplate.body.length} characters
                  </div>
                </div>
                <textarea
                  value={editingTemplate.body}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  placeholder="Enter template body with {{ }} tokens..."
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
                />
              </div>

              {/* Preview */}
              <div className="flex-1 p-6 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preview.length} characters
                  </div>
                </div>
                <div className="h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm whitespace-pre-wrap overflow-y-auto">
                  {preview}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900 border-t border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Template Warnings</h4>
                    <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      {warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
