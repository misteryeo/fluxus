'use client';

import { MessageSquare, Check, X, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Comment } from '../../types';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ReviewPanelProps {
  onApprove: () => void;
  onRequestChanges: () => void;
}

export function ReviewPanel({ onApprove, onRequestChanges }: ReviewPanelProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Alex Kumar',
      avatar: 'AK',
      text: 'Can we add a note about the EU compliance fix? Our European customers will appreciate knowing this was addressed.',
      timestamp: '2 hours ago',
      resolved: false
    },
    {
      id: '2',
      author: 'Jordan Lee',
      avatar: 'JL',
      text: 'The LinkedIn post feels a bit long. Maybe trim the first paragraph?',
      timestamp: '1 hour ago',
      resolved: true
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const reviewers = [
    { name: 'Alex Kumar', avatar: 'AK', status: 'pending' },
    { name: 'Jordan Lee', avatar: 'JL', status: 'approved' },
    { name: 'Morgan Taylor', avatar: 'MT', status: 'pending' }
  ];

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  const handleResolve = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: String(comments.length + 1),
      author: 'You',
      avatar: 'YO',
      text: newComment,
      timestamp: 'Just now',
      resolved: false
    };
    
    setComments([...comments, comment]);
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
          <Button variant="outline" size="sm">
            Add reviewer
          </Button>
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
            <Badge variant="secondary">{comments.length}</Badge>
            {unresolvedCount > 0 && (
              <Badge variant="destructive">{unresolvedCount} unresolved</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
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
                      {comment.avatar}
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleResolve(comment.id)}>
                      {comment.resolved ? 'Unresolve' : 'Resolve'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                {comment.text}
              </p>
              
              {!comment.resolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(comment.id)}
                  className="gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  Resolve
                </Button>
              )}
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
