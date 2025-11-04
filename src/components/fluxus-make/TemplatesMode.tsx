'use client';

import { Plus, Copy, Clock, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Template } from '../../types';
import { mockTemplates } from '../../lib/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

export function TemplatesMode() {
  const handleDuplicate = (template: Template) => {
    toast.success(`Template "${template.name}" duplicated`);
  };

  const handleEdit = (template: Template) => {
    toast.info(`Editing "${template.name}"`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl text-neutral-900 dark:text-neutral-100 mb-1">
              Release Templates
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Audience-specific templates with tone presets and token variables
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New template
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {mockTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDuplicate={handleDuplicate}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function TemplateCard({
  template,
  onDuplicate,
  onEdit
}: {
  template: Template;
  onDuplicate: (template: Template) => void;
  onEdit: (template: Template) => void;
}) {
  const audienceColors = {
    internal: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    customers: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    changelog: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
    linkedin: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300',
    email: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    investors: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <Badge className={audienceColors[template.audience as keyof typeof audienceColors]}>
          {template.audience}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(template)}>
              Edit template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(template)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Clock className="w-4 h-4 mr-2" />
              Version history
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-neutral-900 dark:text-neutral-100 mb-2">
        {template.name}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        {template.description}
      </p>

      <div className="space-y-3 mb-4">
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Tokens</div>
          <div className="flex flex-wrap gap-1">
            {template.tokens.map((token) => (
              <Badge key={token} variant="outline" className="text-xs">
                {token}
              </Badge>
            ))}
          </div>
        </div>

        {template.constraints && (
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Constraints</div>
            <div className="flex gap-2">
              {template.constraints.charLimit && (
                <Badge variant="secondary" className="text-xs">
                  {template.constraints.charLimit} char limit
                </Badge>
              )}
              {template.constraints.lineLimit && (
                <Badge variant="secondary" className="text-xs">
                  {template.constraints.lineLimit} line limit
                </Badge>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Tone defaults</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Concise ↔ Detailed</span>
              <span>{template.toneDefaults.conciseDetailed}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Playful ↔ Formal</span>
              <span>{template.toneDefaults.playfulFormal}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Technical ↔ Lay</span>
              <span>{template.toneDefaults.technicalLay}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Preview</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-300 font-mono bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg line-clamp-3">
          {template.preview}
        </div>
      </div>
    </Card>
  );
}
