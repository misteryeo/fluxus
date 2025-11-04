'use client';

import { Home, FileText, Layout, Image, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DarkModeToggle } from './DarkModeToggle';

interface LeftRailProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function LeftRail({ activeView, onViewChange }: LeftRailProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'releases', icon: FileText, label: 'Releases' },
    { id: 'templates', icon: Layout, label: 'Templates' },
    { id: 'assets', icon: Image, label: 'Assets' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="w-[64px] bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-4 gap-2">
      <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center mb-6">
        <span className="text-neutral-50 dark:text-neutral-900">F</span>
      </div>
      
      <TooltipProvider delayDuration={0}>
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    activeView === item.id
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        <DarkModeToggle />
      </TooltipProvider>
    </div>
  );
}
