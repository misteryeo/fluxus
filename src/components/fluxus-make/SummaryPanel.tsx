'use client';

import { Sparkles, RefreshCw, Eye, Code } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

export interface ToneSettings {
  conciseDetailed: number;
  playfulFormal: number;
  technicalLay: number;
}

interface SummaryPanelProps {
  coreSummary: string;
  onChangeCoreSummary: (value: string) => void;
  userFacingValue?: string;
  onChangeUserFacingValue?: (value: string) => void;
  whatChanged?: string;
  onChangeWhatChanged?: (value: string) => void;
  whyNow?: string;
  onChangeWhyNow?: (value: string) => void;
  toneSettings?: ToneSettings;
  onChangeToneSettings?: (settings: ToneSettings) => void;
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
  toneSettings: externalToneSettings,
  onChangeToneSettings,
  onRegenerate,
  prCount = 0
}: SummaryPanelProps) {
  const [showCitations, setShowCitations] = useState(false);
  const [internalToneSettings, setInternalToneSettings] = useState<ToneSettings>({
    conciseDetailed: 50,
    playfulFormal: 40,
    technicalLay: 60
  });

  // Use external tone settings if provided, otherwise use internal state
  const toneSettings = externalToneSettings || internalToneSettings;
  const handleToneChange = (newSettings: ToneSettings) => {
    if (onChangeToneSettings) {
      onChangeToneSettings(newSettings);
    } else {
      setInternalToneSettings(newSettings);
    }
  };

  const tokens = ['{{version}}', '{{feature}}', '{{team}}', '{{date}}', '{{docs_link}}'];

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

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
          <span>Advanced fields</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
              Impact & Risk
            </label>
            <Textarea
              className="min-h-[60px] resize-none"
              defaultValue="Low risk. Feature can be toggled off per workspace. Monitored rollout to 10% → 50% → 100%."
            />
          </div>
          
          <div>
            <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 block">
              Migration Notes
            </label>
            <Textarea
              className="min-h-[60px] resize-none"
              defaultValue="No breaking changes. Feature is automatically enabled for all users."
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-sm text-neutral-700 dark:text-neutral-300">Available Tokens</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {tokens.map((token) => (
            <Badge 
              key={token} 
              variant="outline" 
              className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {token}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <h4 className="text-sm text-neutral-700 dark:text-neutral-300">Tone Adjustments</h4>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">
              Concise ↔ Detailed
            </label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {toneSettings.conciseDetailed}
            </span>
          </div>
          <Slider
            value={[toneSettings.conciseDetailed]}
            onValueChange={(v) => handleToneChange({ ...toneSettings, conciseDetailed: v[0] })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">
              Playful ↔ Formal
            </label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {toneSettings.playfulFormal}
            </span>
          </div>
          <Slider
            value={[toneSettings.playfulFormal]}
            onValueChange={(v) => handleToneChange({ ...toneSettings, playfulFormal: v[0] })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">
              Technical ↔ Lay
            </label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {toneSettings.technicalLay}
            </span>
          </div>
          <Slider
            value={[toneSettings.technicalLay]}
            onValueChange={(v) => handleToneChange({ ...toneSettings, technicalLay: v[0] })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button onClick={onRegenerate} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate outputs
        </Button>
        <Button variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview all
        </Button>
      </div>
    </div>
  );
}
