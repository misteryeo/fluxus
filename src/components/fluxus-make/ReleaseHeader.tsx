'use client';

import { Edit2, MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useReview } from '@/hooks/useFluxusMake';

interface ReleaseHeaderProps {
  releaseName: string;
  version: string;
  environment: 'beta' | 'ga';
  status: 'draft' | 'in-review' | 'changes-requested' | 'approved' | 'scheduled' | 'published' | 'failed';
  lastUpdated: string;
  owner: string;
  approvers?: string[];
  onRequestReview?: () => void;
  onRequestReviewError?: (error: unknown) => void;
}

export function ReleaseHeader({
  releaseName,
  version,
  environment,
  status: statusProp,
  lastUpdated,
  owner,
  approvers = [],
  onRequestReview,
  onRequestReviewError
}: ReleaseHeaderProps) {
  const { state: reviewState, act: reviewAct } = useReview();

  const statusColors: Record<ReleaseHeaderProps['status'], string> = {
    draft: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    'in-review': 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    'changes-requested': 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    approved: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    scheduled: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    published: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
  };

  const normalizeStatus = (
    value?: string
  ): ReleaseHeaderProps['status'] => {
    if (!value) {
      return statusProp;
    }

    const mapping: Record<string, ReleaseHeaderProps['status']> = {
      draft: 'draft',
      in_review: 'in-review',
      'in-review': 'in-review',
      changes_requested: 'changes-requested',
      'changes-requested': 'changes-requested',
      approved: 'approved',
      scheduled: 'scheduled',
      published: 'published',
      failed: 'failed'
    };

    return mapping[value] ?? statusProp;
  };

  const statusKey = normalizeStatus(reviewState?.status);
  const statusLabelSource = reviewState?.status ?? statusProp;
  const statusLabel = statusLabelSource.replace(/[_-]/g, ' ');

  const handleRequestReview = async () => {
    try {
      await reviewAct('requestReview');
      onRequestReview?.();
    } catch (error) {
      console.error('Failed to request review from header', error);
      onRequestReviewError?.(error);
    }
  };

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-8 py-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            defaultValue={releaseName}
            className="bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 text-xl"
          />
          <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRequestReview} className="gap-2">
            <Users className="w-4 h-4" />
            Request review
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate release</DropdownMenuItem>
              <DropdownMenuItem>Save as preset</DropdownMenuItem>
              <DropdownMenuItem>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete release</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline">{version}</Badge>
        <Badge variant="outline" className="capitalize">{environment}</Badge>
        <Badge className={`${statusColors[statusKey]} capitalize`}>
          {statusLabel}
        </Badge>
        <div className="text-neutral-500 dark:text-neutral-400">
          Updated {lastUpdated} by {owner}
        </div>
        {approvers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 dark:text-neutral-400">Approvers:</span>
            <div className="flex -space-x-1">
              {approvers.map((approver, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px]"
                >
                  {approver.split(' ').map(n => n[0]).join('')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
