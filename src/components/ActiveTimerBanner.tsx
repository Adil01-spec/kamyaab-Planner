// Active Timer Banner - Shows current task timer prominently

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, Pause, Play, ChevronDown, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface ActiveTimerBannerProps {
  taskTitle: string;
  elapsedSeconds: number;
  timerStatus: 'running' | 'paused';
  pausedTimeSeconds: number;
  onComplete: () => void;
  onPause: () => void;
  onResume: () => void;
  onMinimize: () => void;
  onReset: () => void;
  isCompleting?: boolean;
  isPausing?: boolean;
  isResetting?: boolean;
  className?: string;
}

export function ActiveTimerBanner({
  taskTitle,
  elapsedSeconds,
  timerStatus,
  pausedTimeSeconds,
  onComplete,
  onPause,
  onResume,
  onMinimize,
  onReset,
  isCompleting = false,
  isPausing = false,
  isResetting = false,
  className
}: ActiveTimerBannerProps) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
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
  const handleConfirmReset = () => {
    setShowResetDialog(false);
    onReset();
  };

  const isPaused = timerStatus === 'paused';
  const timerDisplay = isPaused
    ? formatTimerDisplay(pausedTimeSeconds)
    : formatTimerDisplay(elapsedSeconds);

  return <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-lg shadow-primary/5",
        className
      )}
    >
      {/* Header with pulsing indicator + minimize */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <AnimatePresence mode="wait">
            {isPaused ? (
              <motion.div key="paused-icon" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Pause className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            ) : (
              <motion.div key="running-icon" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/50 animate-ping" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-xs font-medium text-primary uppercase tracking-wider">
          {isPaused ? 'Paused' : 'Currently working on'}
        </span>
        {/* Minimize button */}
        <button
          onClick={onMinimize}
          className="ml-auto p-1 rounded-md hover:bg-primary/10 transition-colors"
          title="Minimize timer"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
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

      {/* Actions with AnimatePresence for smooth transitions */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {isPaused ? (
            <motion.div
              key="paused-actions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 w-full"
            >
              <Button
                onClick={() => withDebounce(onResume)}
                disabled={debounced}
                className="flex-1 h-12 gradient-kaamyab hover:opacity-90 font-medium"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Resume
              </Button>
              <Button
                variant="outline"
                onClick={handleCompleteClick}
                disabled={isCompleting || debounced}
                className="flex-1 h-12 border-primary/30 hover:bg-primary/5"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Done
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting || debounced}
                className="h-12 w-12 shrink-0 border-destructive/30 hover:bg-destructive/5 text-destructive"
                title="Reset timer"
              >
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="running-actions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 w-full"
            >
              <Button
                variant="outline"
                onClick={() => withDebounce(onPause)}
                disabled={debounced}
                className="flex-1 h-12 border-primary/30 hover:bg-primary/5"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleCompleteClick}
                disabled={isCompleting || debounced}
                className="flex-1 h-12 gradient-kaamyab hover:opacity-90 font-medium"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Done
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting || debounced}
                className="h-12 w-12 shrink-0 border-destructive/30 hover:bg-destructive/5 text-destructive"
                title="Reset timer"
              >
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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

    {/* Reset confirmation dialog */}
    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset this session?</DialogTitle>
          <DialogDescription>
            This will erase <span className="font-mono font-medium">{timerDisplay}</span> of tracked time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setShowResetDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmReset} disabled={isResetting}>
            {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
