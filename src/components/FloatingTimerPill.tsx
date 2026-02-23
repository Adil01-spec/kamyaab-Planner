import { Clock, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatTimerDisplay } from '@/lib/executionTimer';

interface FloatingTimerPillProps {
  taskTitle: string;
  timerStatus: 'running' | 'paused';
  elapsedSeconds: number;
  pausedTimeSeconds: number;
  onRestore: () => void;
}

export function FloatingTimerPill({
  taskTitle,
  timerStatus,
  elapsedSeconds,
  pausedTimeSeconds,
  onRestore,
}: FloatingTimerPillProps) {
  const isPaused = timerStatus === 'paused';
  const displayTime = isPaused ? formatTimerDisplay(pausedTimeSeconds) : formatTimerDisplay(elapsedSeconds);

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onRestore}
      className={cn(
        "fixed bottom-20 sm:bottom-4 right-4 z-50",
        "flex items-center gap-2 px-4 py-2.5 rounded-full",
        "bg-background/95 backdrop-blur-md border border-primary/30",
        "shadow-lg shadow-primary/10 cursor-pointer",
        "hover:scale-105 active:scale-95 transition-transform"
      )}
    >
      {/* Status indicator */}
      <div className="relative flex-shrink-0">
        {isPaused ? (
          <Pause className="w-3 h-3 text-muted-foreground" />
        ) : (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/50 animate-ping" />
          </>
        )}
      </div>

      {/* Time */}
      <span className={cn(
        "font-mono text-sm font-semibold",
        isPaused ? "text-muted-foreground" : "text-primary"
      )}>
        {displayTime}
      </span>

      {/* Task title */}
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
        {taskTitle}
      </span>

      {isPaused && (
        <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
          Paused
        </span>
      )}
    </motion.button>
  );
}
