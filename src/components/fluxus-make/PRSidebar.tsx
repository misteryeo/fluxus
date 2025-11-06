'use client';

import { Search, Filter, Plus, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PR } from '../../types';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { usePRs } from '@/hooks/useFluxusMake';

interface PRSidebarProps {
  selectedIds?: Set<string>;
  onTogglePR?: (pr: PR) => void;
  onCreateRelease?: () => void;
  selectedRepo?: string;
  selectedBranch?: string;
}

export function PRSidebar({
  selectedIds,
  onTogglePR = () => {},
  onCreateRelease = () => {},
  selectedRepo: initialRepo = 'misteryeo/fluxus',
  selectedBranch = 'main'
}: PRSidebarProps = {}) {
  const [currentRepo, setCurrentRepo] = useState(initialRepo);
  useEffect(() => {
    setCurrentRepo(initialRepo);
  }, [initialRepo]);

  const { prs, loading, error, refresh } = usePRs(currentRepo);
  const repoOptions = useMemo(() => {
    const defaults = ['misteryeo/fluxus'];
    return defaults.includes(initialRepo) ? defaults : [initialRepo, ...defaults];
  }, [initialRepo]);

  const selectedCount = selectedIds?.size ?? prs.filter(pr => pr.selected).length;
  const activeFilters = ['merged', 'feature'];

  return (
    <div className="w-[280px] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <div className="text-neutral-900 dark:text-neutral-100">{currentRepo}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{selectedBranch}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {repoOptions.map((repo) => (
                <DropdownMenuCheckboxItem
                  key={repo}
                  checked={repo === currentRepo}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCurrentRepo(repo);
                    }
                  }}
                >
                  {repo}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search PRs..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 ml-1">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <DropdownMenuCheckboxItem checked>Merged PRs</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Feature</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Bugfix</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Security</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={onCreateRelease} className="w-full gap-2" disabled={selectedCount === 0}>
          <Plus className="w-4 h-4" />
          New release from {selectedCount > 0 ? `${selectedCount} PR${selectedCount > 1 ? 's' : ''}` : 'PRs'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <PRRowSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300 flex flex-col gap-3">
              <div className="font-medium">Failed to load PRs</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {error instanceof Error ? error.message : String(error)}
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : (
            prs.map((pr) => (
              <PRRow
                key={pr.id}
                pr={pr}
                isSelected={selectedIds?.has(pr.id) ?? false}
                onToggle={() => onTogglePR(pr)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
        {loading ? 'Loading...' : `${prs.length} PRs • ${selectedCount} selected`}
      </div>
    </div>
  );
}

function PRRow({ pr, isSelected, onToggle }: { pr: PR; isSelected: boolean; onToggle: () => void }) {
  return (
    <div
      className={`p-3 rounded-xl mb-1 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border border-transparent'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2.5">
        <Checkbox checked={isSelected} className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
            #{pr.number} {pr.title}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {pr.labels.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px]">
              {pr.author.avatar}
            </div>
            <span>{pr.author.name}</span>
            <span>•</span>
            <span>{new Date(pr.mergedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PRRowSkeleton() {
  return (
    <div className="p-3 rounded-xl mb-1 border border-transparent">
      <div className="flex items-start gap-2.5">
        <div className="w-4 h-4 mt-0.5 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 animate-pulse" style={{ width: '85%' }} />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-2 animate-pulse" style={{ width: '60%' }} />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" style={{ width: '60px' }} />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" style={{ width: '50px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

