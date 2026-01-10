import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissedTaskNoticeProps {
  missedCount: number;
  show: boolean;
  className?: string;
}

/**
 * A calm, non-judgmental notice that missed tasks have been rolled forward
 */
export function MissedTaskNotice({ missedCount, show, className }: MissedTaskNoticeProps) {
  if (missedCount === 0 || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl",
            "bg-muted/40 border border-border/20",
            className
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-foreground/80">
              {missedCount === 1 
                ? "We moved 1 task forward." 
                : `We moved ${missedCount} tasks forward.`
              }
            </p>
            <p className="text-xs text-muted-foreground/60">
              Let's continue from here.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
