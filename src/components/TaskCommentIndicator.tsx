/**
 * TaskCommentIndicator
 * 
 * Small indicator showing comment count for a task.
 * Only visible on /review page, not during execution.
 */

import { MessageSquare } from 'lucide-react';

interface TaskCommentIndicatorProps {
  count: number;
  onClick?: () => void;
}

export function TaskCommentIndicator({ count, onClick }: TaskCommentIndicatorProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      <MessageSquare className="w-3 h-3" />
      {count}
    </button>
  );
}
