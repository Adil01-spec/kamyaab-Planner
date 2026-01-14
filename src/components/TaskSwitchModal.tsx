// Task Switch Modal - Confirmation when switching tasks while one is active

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Pause, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface TaskSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTaskTitle: string;
  newTaskTitle: string;
  elapsedSeconds: number;
  onPauseAndSwitch: () => void;
  onCompleteAndSwitch: () => void;
  onCancel: () => void;
  isPausing?: boolean;
  isCompleting?: boolean;
}

export function TaskSwitchModal({
  open,
  onOpenChange,
  currentTaskTitle,
  newTaskTitle,
  elapsedSeconds,
  onPauseAndSwitch,
  onCompleteAndSwitch,
  onCancel,
  isPausing = false,
  isCompleting = false,
}: TaskSwitchModalProps) {
  const timerDisplay = formatTimerDisplay(elapsedSeconds);
  const isProcessing = isPausing || isCompleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            Task Already Active
          </DialogTitle>
          <DialogDescription>
            You're currently working on another task. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current task card */}
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
            <h4 className="font-medium text-foreground mb-1 leading-tight">
              {currentTaskTitle}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{timerDisplay}</span>
              <span>elapsed</span>
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* New task card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/50"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Switch to
            </span>
            <h4 className="font-medium text-foreground leading-tight">
              {newTaskTitle}
            </h4>
          </motion.div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {/* Primary actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={onPauseAndSwitch}
              disabled={isProcessing}
              className="flex-1 h-11"
            >
              {isPausing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              Pause & Switch
            </Button>
            <Button
              onClick={onCompleteAndSwitch}
              disabled={isProcessing}
              className="flex-1 h-11 gradient-kaamyab hover:opacity-90"
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Done & Switch
            </Button>
          </div>
          
          {/* Cancel option */}
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full text-muted-foreground"
          >
            Keep working on current task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
