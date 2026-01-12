import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimerDisplay } from '@/lib/executionTimer';
import { cn } from '@/lib/utils';

interface ResumeFocusCTAProps {
  taskTitle: string;
  elapsedSeconds: number;
  onResume: () => void;
  className?: string;
}

/**
 * Resume Focus CTA
 * Shows when a task was left in "doing" state
 * Prominent but not intrusive
 */
export function ResumeFocusCTA({ 
  taskTitle, 
  elapsedSeconds, 
  onResume,
  className 
}: ResumeFocusCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-r from-primary/10 to-primary/5",
        "border border-primary/20",
        "p-4",
        className
      )}
    >
      {/* Subtle pulsing background */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
      />
      
      <div className="relative flex items-center gap-3">
        {/* Timer indicator */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary/70 font-medium mb-0.5">
            Resume working on
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {taskTitle}
          </p>
          {elapsedSeconds > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTimerDisplay(elapsedSeconds)} elapsed
            </p>
          )}
        </div>
        
        {/* Resume button */}
        <Button
          size="sm"
          onClick={onResume}
          className="shrink-0 gap-1.5"
        >
          <Play className="w-3.5 h-3.5" />
          Resume
        </Button>
      </div>
    </motion.div>
  );
}
