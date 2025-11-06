'use client';

import { MessageSquare, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useState } from 'react';

interface ReviewPanelProps {
  status: string;
  comments: Array<{
    id: string;
    author: string;
    avatar?: string;
    text: string;
    timestamp: string;
    resolved?: boolean;
  }>;
  onRequestReview: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onComment: (text: string, anchor?: string) => void;
}

export function ReviewPanel({
  status,
  comments,
  onRequestReview,
  onApprove,
  onRequestChanges,
  onComment
}: ReviewPanelProps) {
  const [newComment, setNewComment] = useState('');
  const reviewers = [
    { name: 'Alex Kumar', avatar: 'AK', status: 'pending' },
    { name: 'Jordan Lee', avatar: 'JL', status: 'approved' },
    { name: 'Morgan Taylor', avatar: 'MT', status: 'pending' }
  ];

  const commentList = Array.isArray(comments) ? comments : [];
  const unresolvedCount = commentList.filter((comment) => !comment.resolved).length;

  const handleAddComment = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    onComment(trimmed);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-neutral-900 dark:text-neutral-100">Reviewers</h3>
            <Badge variant="secondary">{reviewers.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              Status: {status || 'unknown'}
            </Badge>
            <Button variant="outline" size="sm" onClick={onRequestReview} className="gap-2">
              Request review
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {reviewers.map((reviewer, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700">
                  <AvatarFallback className="text-[10px] font-medium">
                    {reviewer.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-neutral-900 dark:text-neutral-100">{reviewer.name}</span>
              </div>
              
              <Badge
                className={
                  reviewer.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }
              >
                {reviewer.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-neutral-900 dark:text-neutral-100">Comments</h3>
            <Badge variant="secondary">{commentList.length}</Badge>
            {unresolvedCount > 0 && (
              <Badge variant="destructive">{unresolvedCount} unresolved</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {commentList.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border ${
                comment.resolved
                  ? 'border-neutral-200 dark:border-neutral-800 opacity-60'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-7 h-7 bg-neutral-200 dark:bg-neutral-700">
                    <AvatarFallback className="text-[10px] font-medium">
                      {(comment.avatar || comment.author || '').slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100">
                      {comment.author}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {comment.timestamp}
                    </div>
                  </div>
                </div>
                <Badge variant={comment.resolved ? 'secondary' : 'outline'} className="text-xs capitalize">
                  {comment.resolved ? 'resolved' : 'open'}
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {comment.text}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Add comment
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          onClick={onApprove}
          disabled={unresolvedCount > 0}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          Approve release
        </Button>
        <Button variant="outline" onClick={onRequestChanges} className="gap-2">
          <X className="w-4 h-4" />
          Request changes
        </Button>
      </div>
    </div>
  );
}
