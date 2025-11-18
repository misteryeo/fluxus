'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useDrafts, useReview, useSummaryGeneration } from '@/hooks/useFluxusMake';

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
  const { drafts, regenerate } = useDrafts();
  const { state: reviewState, act: reviewAct } = useReview();
  const { generate: generateSummary, loading: isGeneratingSummary } = useSummaryGeneration();

  // Summary fields state
  const [userFacingValue, setUserFacingValue] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [whyNow, setWhyNow] = useState('');

  // Debug: Log drafts state changes
  useEffect(() => {
    console.log('[AssembleMode] Drafts state updated:', {
      draftKeys: Object.keys(drafts),
      draftLengths: Object.fromEntries(Object.entries(drafts).map(([key, val]) => [key, val.length])),
      sampleInternal: drafts.internal?.substring(0, 50) + '...',
    });
  }, [drafts]);

  useEffect(() => {
    const summary = selectedPRs
      .map((pr) => `#${pr.number}: ${pr.title}`)
      .join('\n');

    setCoreSummary((prev) => {
      const shouldUpdate = prev.trim().length === 0 || prev === generatedSummaryRef.current;
      generatedSummaryRef.current = summary;
      return shouldUpdate ? summary : prev;
    });
  }, [selectedPRs]);

  // Handle summary generation with default tone settings
  const handleGenerateSummary = async () => {
    if (selectedPRs.length === 0) {
      toast.error('Please select at least one PR');
      return;
    }

    try {
      // Use default tone settings since we removed the tone sliders
      const defaultTone = {
        conciseDetailed: 50,
        playfulFormal: 40,
        technicalLay: 60
      };
      const result = await generateSummary(selectedPRs, defaultTone);

      // Update all fields with generated content
      setCoreSummary(result.technicalSummary);
      setUserFacingValue(result.userFacingValue);
      setWhatChanged(result.whatChanged);
      setWhyNow(result.whyNow);

      // Switch to summary tab to show results
      setActiveStep('summary');

      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate summary');
      console.error('Summary generation error:', error);
    }
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
    // Validate that we have PRs
    if (selectedPRs.length === 0) {
      toast.error('Please select at least one PR before generating audience outputs');
      return;
    }

    // Validate that summary fields have meaningful content
    const hasValidTechnicalSummary = coreSummary.trim().length > 0 &&
      coreSummary !== "Not enough information";
    const hasValidUserValue = userFacingValue.trim().length > 0 &&
      userFacingValue !== "Not enough information";

    if (!hasValidTechnicalSummary || !hasValidUserValue) {
      toast.error('Please generate summary fields first by clicking "Generate summary" in Step 1: Source');
      return;
    }

    try {
      await regenerate({
        contextInput: {
          prs: selectedPRs,
          summaries: {
            technical: coreSummary,
            value: userFacingValue,
          }
        },
        coreSummary,
        userFacingValue,
        whatChanged,
        whyNow,
      });

      toast.success('Generating audience outputs...');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audience outputs';
      toast.error(errorMessage);
      console.error('Regenerate error:', error);
    }
  };

  const handleCopyContent = (audience: string) => {
    toast.success(`Copied ${audience} content to clipboard`);
  };

  const handleCoreSummaryChange = (value: string) => {
    setCoreSummary(value);
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
                    onGenerateSummary={handleGenerateSummary}
                    isGenerating={isGeneratingSummary}
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
                      AI-generated summary from your PRs. Review and edit before generating audience outputs.
                    </p>
                  </div>
                  <SummaryPanel
                    coreSummary={coreSummary}
                    onChangeCoreSummary={handleCoreSummaryChange}
                    userFacingValue={userFacingValue}
                    onChangeUserFacingValue={setUserFacingValue}
                    whatChanged={whatChanged}
                    onChangeWhatChanged={setWhatChanged}
                    whyNow={whyNow}
                    onChangeWhyNow={setWhyNow}
                    onRegenerate={handleRegenerate}
                    prCount={selectedPRs.length}
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
