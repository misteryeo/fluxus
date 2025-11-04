'use client';

import { useState } from 'react';
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

interface AssembleModeProps {
  selectedPRs: PR[];
  assets: Asset[];
  onRemoveAsset: (assetId: string) => void;
  onUploadAsset: () => void;
}

export function AssembleMode({ selectedPRs, assets, onRemoveAsset, onUploadAsset }: AssembleModeProps) {
  const [activeStep, setActiveStep] = useState('source');
  const [releaseStatus, setReleaseStatus] = useState<'draft' | 'in-review' | 'approved' | 'published'>('draft');

  const steps = [
    { id: 'source', label: 'Source', number: 1 },
    { id: 'summary', label: 'Summary & Fields', number: 2 },
    { id: 'audiences', label: 'Audiences', number: 3 },
    { id: 'review', label: 'Review', number: 4 },
    { id: 'publish', label: 'Publish', number: 5 }
  ];

  const handleRegenerate = () => {
    toast.success('Regenerating outputs with updated tone settings...');
  };

  const handleCopyContent = (audience: string) => {
    toast.success(`Copied ${audience} content to clipboard`);
  };

  const handleRequestReview = () => {
    setReleaseStatus('in-review');
    toast.success('Review request sent to team');
  };

  const handleApprove = () => {
    setReleaseStatus('approved');
    toast.success('Release approved! Ready to publish');
  };

  const handleRequestChanges = () => {
    toast.info('Changes requested');
  };

  const handlePublish = () => {
    setReleaseStatus('published');
    toast.success('Release published successfully!');
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
        onRequestReview={handleRequestReview}
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
                  <SummaryPanel onRegenerate={handleRegenerate} />
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
                  <AudiencePanel onCopyContent={handleCopyContent} />
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
                    onApprove={handleApprove}
                    onRequestChanges={handleRequestChanges}
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
