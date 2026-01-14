// Session Recovery Banner - Shown when timer is restored after refresh

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface SessionRecoveryBannerProps {
  taskTitle: string;
  elapsedSeconds: number;
  onResume: () => void;
  onPause: () => void;
  onComplete: () => void;
  onDismiss: () => void;
  isResuming?: boolean;
  isPausing?: boolean;
  isCompleting?: boolean;
  className?: string;
}

export function SessionRecoveryBanner({
  taskTitle,
  elapsedSeconds,
  onResume,
  onPause,
  onComplete,
  onDismiss,
  isResuming = false,
  isPausing = false,
  isCompleting = false,
  className,
}: SessionRecoveryBannerProps) {
  const [show, setShow] = useState(true);
  const timerDisplay = formatTimerDisplay(elapsedSeconds);
  const isProcessing = isResuming || isPausing || isCompleting;

  // Auto-dismiss after 30 seconds if no action taken
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onDismiss();
    }, 30000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          "rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 shadow-lg",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Session Restored
              </span>
              <span className="text-xs text-muted-foreground">
                You were working on this
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShow(false);
              onDismiss();
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Task info */}
        <div className="mb-4">
          <h4 className="font-medium text-foreground mb-1 leading-tight line-clamp-2">
            {taskTitle}
          </h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{timerDisplay}</span>
            <span>elapsed</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={isProcessing}
            className="flex-1 h-9"
          >
            <Pause className="w-4 h-4 mr-1.5" />
            Pause
          </Button>
          <Button
            size="sm"
            onClick={onComplete}
            disabled={isProcessing}
            className="flex-1 h-9 gradient-kaamyab hover:opacity-90"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Done
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onResume}
            disabled={isProcessing}
            className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Resume
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
