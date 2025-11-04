'use client';

import { Calendar, Send, AlertTriangle, CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface PublishPanelProps {
  onPublish: () => void;
  onSchedule: (date: string, time: string) => void;
}

export function PublishPanel({ onPublish, onSchedule }: PublishPanelProps) {
  const [publishMode, setPublishMode] = useState<'now' | 'scheduled'>('now');
  const [channels, setChannels] = useState({
    slack: true,
    changelog: true,
    linkedin: false,
    email: true,
    docs: true
  });
  const [publishStatus, setPublishStatus] = useState<Record<string, 'success' | 'pending' | 'failed'>>({});
  const [showStatus, setShowStatus] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('today');
  const [scheduleTime, setScheduleTime] = useState('12:00');

  const channelConfigs = [
    {
      id: 'slack',
      name: 'Slack',
      config: '#product-updates',
      description: 'Internal team channel'
    },
    {
      id: 'changelog',
      name: 'Changelog',
      config: 'fluxus.com/changelog',
      description: 'Public changelog page'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      config: '@fluxus',
      description: 'Company page post'
    },
    {
      id: 'email',
      name: 'Email',
      config: 'customers@fluxus.com',
      description: '2,847 subscribers'
    },
    {
      id: 'docs',
      name: 'Documentation',
      config: 'docs.fluxus.com',
      description: 'Release notes section'
    }
  ];

  const handlePublish = () => {
    setShowStatus(true);
    const enabledChannels = Object.entries(channels)
      .filter(([, enabled]) => enabled)
      .map(([channel]) => channel);

    // Simulate publishing
    setPublishStatus(
      enabledChannels.reduce((acc, channel) => ({
        ...acc,
        [channel]: 'pending'
      }), {})
    );

    // Simulate results
    setTimeout(() => {
      setPublishStatus({
        slack: 'success',
        changelog: 'success',
        email: 'success',
        linkedin: 'failed',
        docs: 'success'
      });
    }, 2000);
    onPublish();
    if (publishMode === 'scheduled') {
      onSchedule(scheduleDate, scheduleTime);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-neutral-900 dark:text-neutral-100 mb-4">Publish Channels</h3>
        
        <div className="space-y-2">
          {channelConfigs.map((channel) => (
            <Card key={channel.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={channels[channel.id as keyof typeof channels]}
                    onCheckedChange={(checked) =>
                      setChannels({ ...channels, [channel.id]: checked })
                    }
                  />
                  <div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {channel.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {channel.config} • {channel.description}
                    </div>
                  </div>
                </div>
                
                {showStatus && publishStatus[channel.id] && (
                  <Badge
                    className={
                      publishStatus[channel.id] === 'success'
                        ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                        : publishStatus[channel.id] === 'failed'
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }
                  >
                    {publishStatus[channel.id] === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {publishStatus[channel.id] === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                    {publishStatus[channel.id]}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showStatus && publishStatus.linkedin === 'failed' && (
        <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-900 dark:text-red-100">
            <div className="flex items-center justify-between">
              <span>LinkedIn rate limit exceeded. Try again in 15 minutes.</span>
              <Button variant="outline" size="sm" className="gap-2">
                <RotateCw className="w-3.5 h-3.5" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="text-neutral-900 dark:text-neutral-100 mb-4">Schedule</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={publishMode === 'now' ? 'default' : 'outline'}
            onClick={() => setPublishMode('now')}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Publish now
          </Button>
          <Button
            variant={publishMode === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setPublishMode('scheduled')}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>
        </div>

        {publishMode === 'scheduled' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-2 block">
                Date
              </label>
              <Select value={scheduleDate} onValueChange={setScheduleDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="custom">Custom date...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-neutral-700 dark:text-neutral-300 mb-2 block">
                Time
              </label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="17:00">05:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          onClick={handlePublish}
          disabled={!Object.values(channels).some(Boolean)}
          className="gap-2"
          size="lg"
        >
          <Send className="w-4 h-4" />
          {publishMode === 'now' ? 'Publish release' : 'Schedule release'}
        </Button>
        
        {Object.values(channels).filter(Boolean).length > 0 && (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Publishing to {Object.values(channels).filter(Boolean).length} channel(s)
          </span>
        )}
      </div>
    </div>
  );
}
