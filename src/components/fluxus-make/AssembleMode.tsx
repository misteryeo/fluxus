'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReleaseHeader } from './ReleaseHeader';
import { SourcePanel } from './SourcePanel';
import { SummaryPanel } from './SummaryPanel';
import { AudiencePanel } from './AudiencePanel';
import { ReviewPanel } from './ReviewPanel';
import { PublishPanel } from './PublishPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { PR, Asset } from '../../types';
import { toast } from 'sonner';
import { useDrafts, useReview } from '@/hooks/useFluxusMake';
import {
  buildFallbackSummary,
  createSummaryDetailsFromPRs,
  type SummaryDetails,
} from '@/utils/summaryHelpers';

interface AssembleModeProps {
  selectedPRs?: PR[];
  assets: Asset[];
  onRemoveAsset: (assetId: string) => void;
  onUploadAsset: () => void;
}

export function AssembleMode({ selectedPRs = [], assets, onRemoveAsset, onUploadAsset }: AssembleModeProps) {
  const [activeStep, setActiveStep] = useState('source');
  const [coreSummary, setCoreSummary] = useState('');
  const generatedSummaryRef = useRef('');
  const manualSummaryEditsRef = useRef(false);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [generatedSummarySource, setGeneratedSummarySource] = useState<'ai' | 'fallback' | null>(null);
  const [summaryRequestId, setSummaryRequestId] = useState(0);
  const [summaryDetails, setSummaryDetails] = useState<SummaryDetails>({
    userValue: '',
    whatChanged: '',
    whyNow: '',
  });
  const generatedDetailsRef = useRef<SummaryDetails>({
    userValue: '',
    whatChanged: '',
    whyNow: '',
  });
  const manualDetailEditsRef = useRef<Record<keyof SummaryDetails, boolean>>({
    userValue: false,
    whatChanged: false,
    whyNow: false,
  });
  const previousSelectionSignatureRef = useRef<string>('');
  const { drafts, regenerate } = useDrafts();
  const { state: reviewState, act: reviewAct } = useReview();

  const updateGeneratedSummary = useCallback((value: string, source: 'ai' | 'fallback' | null) => {
    generatedSummaryRef.current = value;

    setCoreSummary((prev) => {
      const shouldUpdate = !manualSummaryEditsRef.current || prev.trim().length === 0;

      if (shouldUpdate) {
        manualSummaryEditsRef.current = false;
        return value;
      }

      return prev;
    });

    if (value.trim().length === 0) {
      manualSummaryEditsRef.current = false;
    }

    setGeneratedSummarySource(source);
  }, []);

  useEffect(() => {
    summaryAbortRef.current?.abort();

    const selectionSignature = selectedPRs
      .map((pr) => `${pr.repo ?? ''}#${pr.number ?? ''}`)
      .join('|');

    if (selectedPRs.length === 0) {
      setAiSummaryLoading(false);
      setAiSummaryError(null);
      updateGeneratedSummary('', null);
      setSummaryDetails({ userValue: '', whatChanged: '', whyNow: '' });
      generatedDetailsRef.current = { userValue: '', whatChanged: '', whyNow: '' };
      manualDetailEditsRef.current = { userValue: false, whatChanged: false, whyNow: false };
      manualSummaryEditsRef.current = false;
      previousSelectionSignatureRef.current = selectionSignature;
      summaryAbortRef.current = null;
      return;
    }

    const selectionChanged = previousSelectionSignatureRef.current !== selectionSignature;
    previousSelectionSignatureRef.current = selectionSignature;

    if (selectionChanged) {
      manualDetailEditsRef.current = { userValue: false, whatChanged: false, whyNow: false };
      manualSummaryEditsRef.current = false;
      generatedDetailsRef.current = { userValue: '', whatChanged: '', whyNow: '' };
    }

    const fallbackSummary = buildFallbackSummary(selectedPRs);
    const fallbackDetails = createSummaryDetailsFromPRs(selectedPRs, fallbackSummary);

    const controller = new AbortController();
    summaryAbortRef.current = controller;

    setAiSummaryLoading(true);
    setAiSummaryError(null);
    updateGeneratedSummary(fallbackSummary, 'fallback');

    const applyGeneratedDetails = (details: SummaryDetails) => {
      const normalizedDetails: SummaryDetails = {
        userValue: details.userValue?.trim() ?? '',
        whatChanged: details.whatChanged?.trim() ?? '',
        whyNow: details.whyNow?.trim() ?? '',
      };

      generatedDetailsRef.current = { ...generatedDetailsRef.current, ...normalizedDetails };

      setSummaryDetails((prev) => {
        const updated: SummaryDetails = { ...prev };

        (Object.keys(normalizedDetails) as Array<keyof SummaryDetails>).forEach((key) => {
          const nextValue = normalizedDetails[key];
          const hasManualEdits = manualDetailEditsRef.current[key];
          const currentValue = prev[key];

          if (!hasManualEdits || currentValue.trim().length === 0) {
            updated[key] = nextValue;
            manualDetailEditsRef.current[key] = false;
          }
        });

        return updated;
      });
    };

    applyGeneratedDetails(fallbackDetails);

    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prs: selectedPRs }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message =
            typeof data?.error === 'string'
              ? data.error
              : `Failed to generate summary (status ${res.status})`;
          throw new Error(message);
        }

        const summaryText = typeof data?.summary === 'string' ? data.summary.trim() : '';
        const summarySource = data?.summarySource === 'ai' ? 'ai' : 'fallback';
        const errorMessage = typeof data?.error === 'string' ? data.error : null;

        const nextSummary = summaryText.length > 0 ? summaryText : fallbackSummary;
        updateGeneratedSummary(nextSummary, summarySource);

        const details =
          data && typeof data === 'object' && 'details' in data && data.details
            ? (data.details as Partial<SummaryDetails>)
            : undefined;

        if (details) {
          applyGeneratedDetails({
            userValue: details.userValue ?? fallbackDetails.userValue,
            whatChanged: details.whatChanged ?? fallbackDetails.whatChanged,
            whyNow: details.whyNow ?? fallbackDetails.whyNow,
          });
        }

        setAiSummaryError(
          errorMessage && summarySource === 'ai'
            ? errorMessage
            : summarySource === 'ai'
              ? null
              : errorMessage ?? 'AI summary returned no content. Showing fallback summary.'
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        updateGeneratedSummary(fallbackSummary, 'fallback');
        applyGeneratedDetails(fallbackDetails);
        setAiSummaryError(
          error instanceof Error ? error.message : 'Failed to generate summary.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setAiSummaryLoading(false);
        }
      }
    };

    void fetchSummary();

    return () => {
      controller.abort();
    };
  }, [selectedPRs, summaryRequestId, updateGeneratedSummary]);

  const handleRetrySummary = () => {
    setSummaryRequestId((id) => id + 1);
  };
  
  // Map review status to release status
  const releaseStatus = (reviewState.status === 'draft' ? 'draft' :
    reviewState.status === 'in-review' ? 'in-review' :
    reviewState.status === 'approved' ? 'approved' :
    'published') as 'draft' | 'in-review' | 'approved' | 'published';

  const steps = [
    { id: 'source', label: 'Source', number: 1 },
    { id: 'summary', label: 'Summary & Fields', number: 2 },
    { id: 'audiences', label: 'Audiences', number: 3 },
    { id: 'review', label: 'Review', number: 4 },
    { id: 'publish', label: 'Publish', number: 5 }
  ];

  const handleRegenerate = async () => {
    try {
      await regenerate({
        contextInput: { prs: selectedPRs },
        coreSummary,
        tone: { level: 'concise' }
      });
      
      toast.success('Regenerating outputs with updated tone settings...');
    } catch (error) {
      toast.error('Failed to regenerate drafts');
    }
  };

  const handleCopyContent = (audience: string) => {
    toast.success(`Copied ${audience} content to clipboard`);
  };

  const handleCoreSummaryChange = (value: string) => {
    setCoreSummary(value);
    const generatedValue = generatedSummaryRef.current ?? '';
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      manualSummaryEditsRef.current = false;
      return;
    }

    manualSummaryEditsRef.current = normalizedValue !== generatedValue.trim();
  };

  const handleSummaryDetailChange = (key: keyof SummaryDetails, value: string) => {
    setSummaryDetails((prev) => ({ ...prev, [key]: value }));

    const generatedValue = generatedDetailsRef.current[key] ?? '';
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      manualDetailEditsRef.current[key] = false;
      return;
    }

    manualDetailEditsRef.current[key] = normalizedValue !== generatedValue.trim();
  };

  const notifyRequestReviewSuccess = () => {
    toast.success('Review request sent to team');
  };

  const notifyRequestReviewError = () => {
    toast.error('Failed to request review');
  };

  const handleRequestReview = async () => {
    try {
      await reviewAct('requestReview');
      notifyRequestReviewSuccess();
    } catch (error) {
      notifyRequestReviewError();
    }
  };

  const handleApprove = async () => {
    try {
      await reviewAct('approve');
      toast.success('Release approved! Ready to publish');
    } catch (error) {
      toast.error('Failed to approve release');
    }
  };

  const handleRequestChanges = async () => {
    try {
      await reviewAct('requestChanges');
      toast.info('Changes requested');
    } catch (error) {
      toast.error('Failed to request changes');
    }
  };

  const isManualSummary = coreSummary !== generatedSummaryRef.current;
  const displayedSummarySource = isManualSummary ? null : generatedSummarySource;

  const handleComment = async (text: string, anchor?: string) => {
    if (!text.trim()) {
      return;
    }

    try {
      await reviewAct('comment', { text, anchor });
      toast.success('Comment submitted');
    } catch (error) {
      toast.error('Failed to submit comment');
    }
  };

  const handlePublish = async (selectedChannels: Record<string, boolean>) => {
    try {
      await reviewAct('publish');
      toast.success('Release published successfully!');
    } catch (error) {
      toast.error('Failed to publish release');
    }
  };

  const handleSchedule = (date: string, time: string) => {
    toast.success(`Release scheduled for ${date} at ${time}`);
  };

  return (
    <div className="flex flex-col h-full">
      <ReleaseHeader
        releaseName="Billing Dashboard Collaboration & EU Fixes"
        version="v2.4.0"
        environment="ga"
        status={releaseStatus}
        lastUpdated="2 hours ago"
        owner="Sarah Chen"
        approvers={releaseStatus !== 'draft' ? ['Alex Kumar', 'Jordan Lee'] : undefined}
        onRequestReview={notifyRequestReviewSuccess}
        onRequestReviewError={notifyRequestReviewError}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeStep} onValueChange={setActiveStep} className="h-full flex flex-col">
          <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 px-8">
            <TabsList className="h-14 bg-transparent">
              {steps.map((step) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 data-[state=active]:bg-neutral-900 data-[state=active]:text-white dark:data-[state=active]:bg-neutral-100 dark:data-[state=active]:text-neutral-900 flex items-center justify-center text-xs">
                    {step.number}
                  </span>
                  {step.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-8">
              <TabsContent value="source" className="mt-0">
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                      Source Data
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Connect PRs and add supporting assets for this release
                    </p>
                  </div>
                  <SourcePanel
                    selectedPRs={selectedPRs}
                    assets={assets}
                    onRemoveAsset={onRemoveAsset}
                    onUploadAsset={onUploadAsset}
                  />
                </div>
              </TabsContent>

              <TabsContent value="summary" className="mt-0">
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                      Release Summary
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      AI-generated summary from your PRs. Edit and adjust tone before generating audience outputs.
                    </p>
                  </div>
                  <SummaryPanel
                    coreSummary={coreSummary}
                    onChangeCoreSummary={handleCoreSummaryChange}
                    onRegenerate={handleRegenerate}
                    aiSummaryLoading={aiSummaryLoading}
                    aiSummaryError={aiSummaryError}
                    generatedSummarySource={displayedSummarySource}
                    onRetrySummary={handleRetrySummary}
                    isManualSummary={isManualSummary}
                    userValue={summaryDetails.userValue}
                    whatChanged={summaryDetails.whatChanged}
                    whyNow={summaryDetails.whyNow}
                    onChangeUserValue={(value) =>
                      handleSummaryDetailChange('userValue', value)
                    }
                    onChangeWhatChanged={(value) =>
                      handleSummaryDetailChange('whatChanged', value)
                    }
                    onChangeWhyNow={(value) =>
                      handleSummaryDetailChange('whyNow', value)
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="audiences" className="mt-0">
                <div className="max-w-6xl">
                  <div className="mb-6">
                    <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                      Audience Outputs
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Tailored content for each audience. Edit, customize settings, and copy when ready.
                    </p>
                  </div>
                  <AudiencePanel onCopyContent={handleCopyContent} drafts={drafts} />
                </div>
              </TabsContent>

              <TabsContent value="review" className="mt-0">
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                      Review & Approval
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Request reviews, address comments, and get approval before publishing.
                    </p>
                  </div>
                  <ReviewPanel
                    status={reviewState.status}
                    comments={reviewState.comments ?? []}
                    onRequestReview={handleRequestReview}
                    onApprove={handleApprove}
                    onRequestChanges={handleRequestChanges}
                    onComment={handleComment}
                  />
                </div>
              </TabsContent>

              <TabsContent value="publish" className="mt-0">
                <div className="max-w-4xl">
                  <div className="mb-6">
                    <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-2">
                      Publish Release
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Choose channels and publish or schedule your release.
                    </p>
                  </div>
                  <PublishPanel
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                    drafts={drafts}
                  />
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
