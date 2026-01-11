// Task Execution Badge - Shows task status and timer inline

import { Clock, Play, CheckCircle, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimerDisplay, formatTotalTime } from '@/lib/executionTimer';
import { motion } from 'framer-motion';

interface TaskExecutionBadgeProps {
  status: 'idle' | 'doing' | 'done';
  elapsedSeconds?: number;
  timeSpentSeconds?: number;
  onClick?: () => void;
  className?: string;
}

export function TaskExecutionBadge({
  status,
  elapsedSeconds = 0,
  timeSpentSeconds = 0,
  onClick,
  className,
}: TaskExecutionBadgeProps) {
  if (status === 'doing') {
    return (
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-primary/10 text-primary border border-primary/30",
          "hover:bg-primary/20 transition-colors cursor-pointer",
          className
        )}
      >
        {/* Pulsing dot */}
        <span className="relative">
          <span className="w-2 h-2 rounded-full bg-primary block" />
          <span className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping" />
        </span>
        
        <Clock className="w-3 h-3" />
        <span className="font-mono">{formatTimerDisplay(elapsedSeconds)}</span>
      </motion.button>
    );
  }

  if (status === 'done') {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
          "bg-muted/50 text-muted-foreground",
          className
        )}
      >
        <CheckCircle className="w-3 h-3" />
        {timeSpentSeconds > 0 && (
          <span className="font-mono">{formatTotalTime(timeSpentSeconds)}</span>
        )}
      </div>
    );
  }

  // Idle state - show start button if onClick provided
  if (onClick) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary",
          "border border-transparent hover:border-primary/30 transition-all cursor-pointer",
          className
        )}
      >
        <Play className="w-3 h-3" />
        <span>Start</span>
      </button>
    );
  }

  // No badge for idle without onClick
  return null;
}
