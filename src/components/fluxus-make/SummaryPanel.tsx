'use client';

import { Sparkles, Code } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useState } from 'react';

interface SummaryPanelProps {
  coreSummary: string;
  onChangeCoreSummary: (value: string) => void;
  userFacingValue?: string;
  onChangeUserFacingValue?: (value: string) => void;
  whatChanged?: string;
  onChangeWhatChanged?: (value: string) => void;
  whyNow?: string;
  onChangeWhyNow?: (value: string) => void;
  onRegenerate: () => void;
  prCount?: number;
}

export function SummaryPanel({
  coreSummary,
  onChangeCoreSummary,
  userFacingValue = '',
  onChangeUserFacingValue,
  whatChanged = '',
  onChangeWhatChanged,
  whyNow = '',
  onChangeWhyNow,
  onRegenerate,
  prCount = 0
}: SummaryPanelProps) {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          AI-generated summary from {prCount} {prCount === 1 ? 'PR' : 'PRs'}. Review and edit before generating outputs.
        </AlertDescription>
      </Alert>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Technical Summary
          </label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowCitations(!showCitations)}
            className="gap-2"
          >
            <Code className="w-4 h-4" />
            {showCitations ? 'Hide' : 'Show'} citations
          </Button>
        </div>
        <Textarea
          className="min-h-[120px] resize-none"
          value={coreSummary}
          onChange={(event) => onChangeCoreSummary(event.target.value)}
        />
        
        {showCitations && (
          <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-xs">
            <div className="text-neutral-600 dark:text-neutral-400 mb-1">Citations from PR #1247:</div>
            <code className="text-neutral-900 dark:text-neutral-100">
              + Added WebSocket connection for real-time updates
              <br />
              + Implemented cursor tracking with Y.js CRDT
            </code>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
          User-Facing Value
        </label>
        <Textarea
          className="min-h-[100px] resize-none"
          value={userFacingValue}
          onChange={(e) => onChangeUserFacingValue?.(e.target.value)}
          placeholder="Describe the user-facing value of this release..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
            What Changed
          </label>
          <Textarea
            className="min-h-[80px] resize-none"
            value={whatChanged}
            onChange={(e) => onChangeWhatChanged?.(e.target.value)}
            placeholder="List what changed..."
          />
        </div>

        <div>
          <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
            Why Now
          </label>
          <Textarea
            className="min-h-[80px] resize-none"
            value={whyNow}
            onChange={(e) => onChangeWhyNow?.(e.target.value)}
            placeholder="Explain why now..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6">
        <Button onClick={onRegenerate} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate for audiences
        </Button>
      </div>
    </div>
  );
}
