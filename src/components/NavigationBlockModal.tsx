// Navigation Block Modal - Shown when user tries to navigate with active task

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, ArrowRight, Pause, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface NavigationBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  elapsedSeconds: number;
  destinationPath: string | null;
  onPauseAndLeave: () => void;
  onCompleteAndLeave: () => void;
  onStay: () => void;
  isPausing?: boolean;
  isCompleting?: boolean;
}

export function NavigationBlockModal({
  open,
  onOpenChange,
  taskTitle,
  elapsedSeconds,
  destinationPath,
  onPauseAndLeave,
  onCompleteAndLeave,
  onStay,
  isPausing = false,
  isCompleting = false,
}: NavigationBlockModalProps) {
  const timerDisplay = formatTimerDisplay(elapsedSeconds);
  const isProcessing = isPausing || isCompleting;

  // Get friendly destination name
  const getDestinationName = (path: string | null): string => {
    if (!path) return 'another page';
    if (path.includes('/home')) return 'Home';
    if (path.includes('/plan')) return 'Plan';
    if (path.includes('/today')) return 'Today';
    return 'another page';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </div>
            Task Still Running
          </DialogTitle>
          <DialogDescription>
            You have an active task. What would you like to do before leaving?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/50 animate-ping" />
              </div>
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Currently working on
              </span>
            </div>
            <h4 className="font-medium text-foreground mb-2 leading-tight">
              {taskTitle}
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{timerDisplay}</span>
                <span>elapsed</span>
              </div>
              <span className="text-xs text-muted-foreground">
                → {getDestinationName(destinationPath)}
              </span>
            </div>
          </motion.div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Your time will be saved automatically.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={onPauseAndLeave}
              disabled={isProcessing}
              className="flex-1 h-11"
            >
              {isPausing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              Pause & Leave
            </Button>
            <Button
              onClick={onCompleteAndLeave}
              disabled={isProcessing}
              className="flex-1 h-11 gradient-kaamyab hover:opacity-90"
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Done & Leave
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={onStay}
            disabled={isProcessing}
            className="w-full text-muted-foreground"
          >
            Keep working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
