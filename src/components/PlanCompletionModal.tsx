// Plan Completion Modal - Shows when all tasks are done

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trophy, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCompletionTime } from '@/lib/executionTimer';
import confetti from 'canvas-confetti';

interface PlanCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalTimeSpentSeconds: number;
  totalTasks: number;
}

export function PlanCompletionModal({
  open,
  onOpenChange,
  totalTimeSpentSeconds,
  totalTasks,
}: PlanCompletionModalProps) {
  const { hours, minutes } = formatCompletionTime(totalTimeSpentSeconds);

  // Trigger celebration on open
  useEffect(() => {
    if (open) {
      // Grand confetti burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#22c55e', '#10b981'],
      });

      // Delayed side bursts
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.6 },
          colors: ['#22c55e', '#10b981', '#06b6d4'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#22c55e'],
        });
      }, 300);
    }
  }, [open]);

  // Format time display
  const getTimeDisplay = (): string => {
    if (hours === 0 && minutes === 0) {
      return 'Less than a minute';
    }
    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <DialogTitle className="text-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              🎉 Plan Completed!
            </motion.span>
          </DialogTitle>
          <DialogDescription className="text-base">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              You've accomplished something incredible.
            </motion.span>
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="py-6"
        >
          <div className="text-center space-y-4">
            {/* Time spent card */}
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/5 border border-primary/20">
              <Clock className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Time actively working
                </p>
                <p className="text-xl font-bold text-foreground">
                  {getTimeDisplay()}
                </p>
              </div>
            </div>

            {/* Tasks completed */}
            <p className="text-sm text-muted-foreground">
              Completed <span className="font-semibold text-foreground">{totalTasks}</span> tasks
            </p>

            {/* Motivational message */}
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Incredible discipline. Keep going.</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full gradient-kaamyab hover:opacity-90 h-12"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
