// Active Timer Banner - Shows current task timer prominently

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface ActiveTimerBannerProps {
  taskTitle: string;
  elapsedSeconds: number;
  onComplete: () => void;
  onPause: () => void;
  onResume?: () => void;
  isCompleting?: boolean;
  isPausing?: boolean;
  variant?: 'prominent' | 'compact';
  executionStatus?: 'doing' | 'paused';
  pausedTimeSeconds?: number;
  className?: string;
}

export function ActiveTimerBanner({
  taskTitle,
  elapsedSeconds,
  onComplete,
  onPause,
  onResume,
  isCompleting = false,
  isPausing = false,
  variant = 'prominent',
  executionStatus = 'doing',
  pausedTimeSeconds = 0,
  className
}: ActiveTimerBannerProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [debounced, setDebounced] = useState(false);

  const withDebounce = useCallback((fn: () => void) => {
    if (debounced) return;
    setDebounced(true);
    fn();
    setTimeout(() => setDebounced(false), 300);
  }, [debounced]);

  const handleCompleteClick = () => {
    setShowCompleteDialog(true);
  };
  const handleConfirmComplete = () => {
    setShowCompleteDialog(false);
    onComplete();
  };

  const isPaused = executionStatus === 'paused';
  const timerDisplay = isPaused
    ? formatTimerDisplay(pausedTimeSeconds)
    : formatTimerDisplay(elapsedSeconds);

  if (variant === 'compact') {
    return <>
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20", className)}>
          {/* Pulsing indicator */}
          <div className="relative">
            {isPaused ? (
              <Pause className="w-3 h-3 text-muted-foreground" />
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/50 animate-ping" />
              </>
            )}
          </div>
          
          {/* Timer display */}
          <div className={cn("flex items-center gap-2 text-sm", isPaused && "opacity-70")}>
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono font-medium text-primary">{timerDisplay}</span>
            {isPaused && <span className="text-xs text-muted-foreground">Paused</span>}
          </div>
          
          {/* Task title - truncated */}
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {taskTitle}
          </span>
          
          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {isPaused ? (
              <Button variant="default" size="sm" onClick={() => withDebounce(() => onResume?.())} disabled={debounced} className="h-7 px-2 text-xs gradient-kaamyab">
                <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                Resume
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => withDebounce(onPause)} disabled={debounced} className="h-7 w-7 p-0" title="Pause">
                  <Pause className="w-3.5 h-3.5" />
                </Button>
                <Button variant="default" size="sm" onClick={handleCompleteClick} disabled={isCompleting || debounced} className="h-7 px-2 text-xs gradient-kaamyab">
                  Done
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Task?</DialogTitle>
              <DialogDescription>
                Did you complete this task?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-foreground font-medium mb-2">{taskTitle}</p>
              <p className="text-sm text-muted-foreground">
                Time spent: <span className="font-mono">{timerDisplay}</span>
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Not yet
              </Button>
              <Button onClick={handleConfirmComplete} disabled={isCompleting} className="gradient-kaamyab">
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, completed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>;
  }

  // Prominent variant (default)
  return <>
      <motion.div initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} className={cn("rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-lg shadow-primary/5 opacity-100", className)}>
        {/* Header with pulsing indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            {isPaused ? (
              <Pause className="w-4 h-4 text-muted-foreground" />
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/50 animate-ping" />
              </>
            )}
          </div>
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {isPaused ? 'Paused' : 'Currently working on'}
          </span>
        </div>

        {/* Task title */}
        <h3 className="text-lg font-semibold text-foreground mb-4 leading-tight">
          {taskTitle}
        </h3>

        {/* Timer display */}
        <div className="flex items-center justify-center mb-5">
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-xl bg-background/80 border border-border/50",
            isPaused && "opacity-70"
          )}>
            {isPaused ? (
              <Pause className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Clock className="w-5 h-5 text-primary" />
            )}
            <span className={cn(
              "text-3xl font-mono font-bold tracking-wider",
              isPaused ? "text-muted-foreground" : "text-foreground"
            )}>
              {timerDisplay}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isPaused ? (
            <Button onClick={() => withDebounce(() => onResume?.())} disabled={debounced} className="flex-1 h-12 gradient-kaamyab hover:opacity-90 font-medium">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Resume
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => withDebounce(onPause)} disabled={debounced} className="flex-1 h-12 border-primary/30 hover:bg-primary/5">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button onClick={handleCompleteClick} disabled={isCompleting || debounced} className="flex-1 h-12 gradient-kaamyab hover:opacity-90 font-medium">
                <CheckCircle className="w-5 h-5 mr-2" />
                Done
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Completion confirmation dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Task?</DialogTitle>
            <DialogDescription>
              Did you complete this task?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground font-medium mb-2">{taskTitle}</p>
            <p className="text-sm text-muted-foreground">
              Time spent: <span className="font-mono font-medium">{timerDisplay}</span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Not yet
            </Button>
            <Button onClick={handleConfirmComplete} disabled={isCompleting} className="gradient-kaamyab">
              <CheckCircle className="w-4 h-4 mr-2" />
              Yes, completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
