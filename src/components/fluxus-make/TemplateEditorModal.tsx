'use client';

import { useState, useEffect } from 'react';
import { X, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import type { Audience } from '@/types/audience';
import type { Template } from '@/lib/defaultTemplates';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface TemplatesResponse {
  templates: Record<Audience, Template>;
  customized: Record<Audience, boolean>;
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  internal: 'Internal #shipped',
  customer: 'Customers',
  investor: 'Investors',
  public: 'Public (Changelog/LinkedIn)',
};

const AVAILABLE_TOKENS = [
  { token: '{{ whyNow }}', description: 'Why this release matters now' },
  { token: '{{ summaries.technical }}', description: 'Technical summary of changes' },
  { token: '{{ summaries.value }}', description: 'User-facing value proposition' },
  { token: '{{ whatChanged }}', description: 'What changed in this release' },
  { token: '{{ risks }}', description: 'Risks and limitations' },
  { token: '{{ nextSteps }}', description: 'Next steps for the team' },
  { token: '{{ kpis }}', description: 'Key performance indicators' },
  { token: '{{ nextMilestone }}', description: 'Next milestone or checkpoint' },
  { token: '{{ whoGetsIt }}', description: 'Who gets access to this release' },
  { token: '{{ howToAccess }}', description: 'How users can access the feature' },
  { token: '{{ meta.featureName }}', description: 'Feature name' },
  { token: '{{ meta.status }}', description: 'Release status (beta, ga, etc.)' },
  { token: '{{ meta.version }}', description: 'Version number' },
  { token: '{{ links.prUrl }}', description: 'Pull request URL' },
  { token: '{{ links.linearUrl }}', description: 'Linear ticket URL' },
  { token: '{{ links.docsUrl }}', description: 'Documentation URL' },
];

const HELPER_FUNCTIONS = [
  { helper: 'or(a, b)', description: 'Return first truthy value or fallback' },
  { helper: 'clamp(text, maxChars)', description: 'Truncate text with ellipsis' },
  { helper: 'bullets(text, maxItems)', description: 'Convert to bullet points' },
  { helper: 'upper(text)', description: 'Convert to uppercase' },
  { helper: 'title(text)', description: 'Convert to title case' },
];

export function TemplateEditorModal({ isOpen, onClose, onSave }: TemplateEditorModalProps) {
  const [activeAudience, setActiveAudience] = useState<Audience>('internal');
  const [templates, setTemplates] = useState<Record<Audience, Template> | null>(null);
  const [customized, setCustomized] = useState<Record<Audience, boolean>>({});
  const [editedBodies, setEditedBodies] = useState<Record<Audience, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/templates');
      if (!res.ok) {
        throw new Error('Failed to load templates');
      }

      const data: TemplatesResponse = await res.json();
      setTemplates(data.templates);
      setCustomized(data.customized);

      // Initialize edited bodies
      const bodies: Record<string, string> = {};
      for (const [audience, template] of Object.entries(data.templates)) {
        bodies[audience] = template.body;
      }
      setEditedBodies(bodies as Record<Audience, string>);
    } catch (err) {
      setError((err as Error).message);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templates) return;

    setSaving(true);
    setError(null);

    try {
      // Save only changed templates
      const savePromises: Promise<Response>[] = [];

      for (const audience of Object.keys(editedBodies) as Audience[]) {
        const originalBody = templates[audience].body;
        const editedBody = editedBodies[audience];

        if (editedBody !== originalBody) {
          savePromises.push(
            fetch('/api/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'save',
                audience,
                body: editedBody,
              }),
            })
          );
        }
      }

      if (savePromises.length === 0) {
        toast.info('No changes to save');
        onClose();
        return;
      }

      const results = await Promise.all(savePromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to save ${failed.length} template(s)`);
      }

      toast.success(`Saved ${savePromises.length} template(s)`);

      // Call onSave callback and wait for it to complete (e.g., regenerating audience outputs)
      if (onSave) {
        toast.info('Regenerating audience outputs with new templates...');
        await onSave();
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
      toast.error('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (audience: Audience) => {
    if (!templates) return;

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          audience,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reset template');
      }

      // Reload templates to get the default
      await loadTemplates();
      toast.success(`Reset ${audience} template to default`);
    } catch (err) {
      toast.error('Failed to reset template');
    }
  };

  const handleTextChange = (audience: Audience, value: string) => {
    setEditedBodies(prev => ({
      ...prev,
      [audience]: value,
    }));
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copied to clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Edit Audience Templates
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Customize the template body for each audience output
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-neutral-200 dark:border-neutral-800">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-neutral-600 dark:text-neutral-400">Loading templates...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : (
              <Tabs value={activeAudience} onValueChange={(v) => setActiveAudience(v as Audience)} className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 pt-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((audience) => (
                      <TabsTrigger key={audience} value={audience} className="relative">
                        {AUDIENCE_LABELS[audience]}
                        {customized[audience] && (
                          <Badge variant="secondary" className="ml-2 text-xs">Custom</Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                  {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((audience) => (
                    <TabsContent key={audience} value={audience} className="h-full overflow-y-auto p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Template Body
                        </h3>
                        {customized[audience] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReset(audience)}
                            className="gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset to Default
                          </Button>
                        )}
                      </div>

                      <Textarea
                        className="min-h-[400px] font-mono text-sm"
                        value={editedBodies[audience] || ''}
                        onChange={(e) => handleTextChange(audience, e.target.value)}
                        placeholder="Enter template body with {{ tokens }}..."
                      />

                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Character count: {editedBodies[audience]?.length || 0}
                      </p>
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            )}
          </div>

          {/* Right: Token Reference */}
          <div className="w-80 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Available Tokens
                </h3>
                <div className="space-y-2">
                  {AVAILABLE_TOKENS.map(({ token, description }) => (
                    <div
                      key={token}
                      className="p-2 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                      onClick={() => copyToken(token)}
                    >
                      <code className="text-xs text-neutral-900 dark:text-neutral-100">
                        {token}
                      </code>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Helper Functions
                </h3>
                <div className="space-y-2">
                  {HELPER_FUNCTIONS.map(({ helper, description }) => (
                    <div
                      key={helper}
                      className="p-2 rounded border border-neutral-200 dark:border-neutral-700"
                    >
                      <code className="text-xs text-neutral-900 dark:text-neutral-100">
                        {helper}
                      </code>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Templates
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
