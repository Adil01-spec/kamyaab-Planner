// Start Task Modal - Confirmation before starting a task

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StartTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  estimatedHours: number;
  onStart: () => void;
  isStarting?: boolean;
}

export function StartTaskModal({
  open,
  onOpenChange,
  taskTitle,
  estimatedHours,
  onStart,
  isStarting = false,
}: StartTaskModalProps) {
  const handleStart = () => {
    onStart();
  };

  // Format estimated time
  const getTimeEstimate = (hours: number): string => {
    if (hours < 1) return `~${Math.round(hours * 60)} minutes`;
    if (hours === 1) return '~1 hour';
    return `~${hours} hours`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Play className="w-4 h-4 text-primary-foreground" />
            </div>
            Start Task?
          </DialogTitle>
          <DialogDescription>
            Are you doing this task now? A timer will start tracking your focused time.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/50"
          >
            <h4 className="font-medium text-foreground mb-2 leading-tight">
              {taskTitle}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Estimated: {getTimeEstimate(estimatedHours)}</span>
            </div>
          </motion.div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting}
            className="gradient-kaamyab hover:opacity-90"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
