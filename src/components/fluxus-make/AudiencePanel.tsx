'use client';

import { Copy, Check, Smile, Settings2, Diff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';

interface AudiencePanelProps {
  onCopyContent: (audience: string) => void;
  drafts?: Partial<Record<'internal'|'customers'|'changelog'|'linkedin'|'email'|'investor', string>>;
}

export function AudiencePanel({ onCopyContent, drafts }: AudiencePanelProps) {
  const [activeTab, setActiveTab] = useState('internal');
  const [copied, setCopied] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [audienceSettings, setAudienceSettings] = useState({
    emojis: true,
    cta: true
  });

  const handleCopy = (audience: string) => {
    // Map 'investors' to 'investor' for drafts key
    const draftKey = audience === 'investors' ? 'investor' : audience as 'internal'|'customers'|'changelog'|'linkedin'|'email'|'investor';
    const content = drafts?.[draftKey] ?? '';
    navigator.clipboard.writeText(content);
    setCopied(audience);
    onCopyContent(audience);
    setTimeout(() => setCopied(null), 2000);
  };

  const audiences = [
    { id: 'internal', label: 'Internal #shipped', count: 156 },
    { id: 'customers', label: 'Customers', count: 245 },
    { id: 'changelog', label: 'Changelog', count: 512 },
    { id: 'linkedin', label: 'LinkedIn', count: 2847, limit: 3000 },
    { id: 'email', label: 'Email', count: 423 },
    { id: 'investors', label: 'Investors', count: 289 }
  ];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-6 w-auto">
            {audiences.map((audience) => (
              <TabsTrigger key={audience.id} value={audience.id} className="gap-2">
                {audience.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiff(!showDiff)}
              className="gap-2"
            >
              <Diff className="w-4 h-4" />
              {showDiff ? 'Hide' : 'Show'} diff
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {audiences.map((audience) => {
          const draftKey = audience.id === 'investors' ? 'investor' : audience.id as 'internal'|'customers'|'changelog'|'linkedin'|'email'|'investor';
          const content = drafts?.[draftKey] ?? '';
          const charCount = content.length;
          
          return (
          <TabsContent key={audience.id} value={audience.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {charCount} {audience.limit ? `/ ${audience.limit}` : ''} characters
                </Badge>
                {audience.limit && charCount > audience.limit * 0.9 && (
                  <Badge variant="destructive">Near limit</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={audienceSettings.emojis}
                    onCheckedChange={(checked) =>
                      setAudienceSettings({ ...audienceSettings, emojis: checked })
                    }
                  />
                  <label className="text-sm text-neutral-600 dark:text-neutral-400">
                    <Smile className="w-4 h-4 inline mr-1" />
                    Emojis
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={audienceSettings.cta}
                    onCheckedChange={(checked) =>
                      setAudienceSettings({ ...audienceSettings, cta: checked })
                    }
                  />
                  <label className="text-sm text-neutral-600 dark:text-neutral-400">
                    Include CTA
                  </label>
                </div>
              </div>
            </div>

            <div className="relative">
              <Textarea
                className="min-h-[400px] resize-none font-mono text-sm"
                value={content}
                readOnly={!showDiff}
              />
              
              {showDiff && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="bg-green-100/50 dark:bg-green-900/20 h-6 mt-[120px] ml-4 mr-4" />
                  <div className="bg-red-100/50 dark:bg-red-900/20 h-6 mt-[180px] ml-4 mr-4" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Last regenerated 2 minutes ago
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(audience.id)}
                className="gap-2"
              >
                {copied === audience.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
