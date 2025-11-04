/* eslint-disable @next/next/no-img-element */
'use client';

import { Github, Upload, ExternalLink, X } from 'lucide-react';
import { PR, Asset } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface SourcePanelProps {
  selectedPRs: PR[];
  assets: Asset[];
  onRemoveAsset: (assetId: string) => void;
  onUploadAsset: () => void;
}

export function SourcePanel({ selectedPRs, assets, onRemoveAsset, onUploadAsset }: SourcePanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Github className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          <h3 className="text-neutral-900 dark:text-neutral-100">Connected PRs</h3>
          <Badge variant="secondary">{selectedPRs.length}</Badge>
        </div>
        
        <div className="space-y-2">
          {selectedPRs.map((pr) => (
            <Card key={pr.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-neutral-900 dark:text-neutral-100 mb-1">
                    #{pr.number} {pr.title}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>{pr.author.name}</span>
                    <span>•</span>
                    <span>{new Date(pr.mergedDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{pr.filesChanged} files changed</span>
                  </div>
                </div>
                <a href="#" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {pr.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {pr.riskLevel && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      pr.riskLevel === 'high' 
                        ? 'border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' 
                        : pr.riskLevel === 'medium'
                        ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {pr.riskLevel} risk
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-neutral-900 dark:text-neutral-100">Assets</h3>
            <Badge variant="secondary">{assets.length}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onUploadAsset} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="relative group overflow-hidden">
              <img 
                src={asset.thumbnail || asset.url} 
                alt={asset.name}
                className="w-full h-32 object-cover"
              />
              <button
                onClick={() => onRemoveAsset(asset.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="p-3">
                <div className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {asset.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                  {asset.type}
                </div>
              </div>
            </Card>
          ))}
          
          <button
            onClick={onUploadAsset}
            className="h-[180px] border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex flex-col items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">Drop files or click</span>
          </button>
        </div>
      </div>
    </div>
  );
}
