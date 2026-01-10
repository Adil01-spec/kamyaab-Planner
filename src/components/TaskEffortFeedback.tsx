import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, Meh, Frown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EffortLevel = 'easy' | 'okay' | 'hard';

interface TaskEffortFeedbackProps {
  taskTitle: string;
  onSubmit: (effort: EffortLevel) => void;
  onSkip: () => void;
  open: boolean;
}

const effortOptions: { level: EffortLevel; icon: typeof SmilePlus; label: string; color: string }[] = [
  { level: 'easy', icon: SmilePlus, label: 'Easy', color: 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
  { level: 'okay', icon: Meh, label: 'Okay', color: 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
  { level: 'hard', icon: Frown, label: 'Hard', color: 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20' },
];

export function TaskEffortFeedback({ 
  taskTitle, 
  onSubmit, 
  onSkip, 
  open 
}: TaskEffortFeedbackProps) {
  const [selectedEffort, setSelectedEffort] = useState<EffortLevel | null>(null);

  const handleSelect = (effort: EffortLevel) => {
    setSelectedEffort(effort);
    // Auto-submit after selection with brief delay for visual feedback
    setTimeout(() => {
      onSubmit(effort);
      setSelectedEffort(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onSkip}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full max-w-sm mx-4 sm:mx-auto mb-8 sm:mb-0",
              "bg-card rounded-2xl border border-border/30 shadow-lg",
              "p-6 sm:p-8"
            )}
          >
            {/* Skip button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              aria-label="Skip"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="text-center mb-6">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
                Quick check-in
              </p>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                How was that task?
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {taskTitle}
              </p>
            </div>

            {/* Effort buttons */}
            <div className="flex gap-3 justify-center mb-4">
              {effortOptions.map(({ level, icon: Icon, label, color }) => (
                <Button
                  key={level}
                  variant="outline"
                  onClick={() => handleSelect(level)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 h-auto py-4 px-3 transition-all",
                    "border rounded-xl",
                    color,
                    selectedEffort === level && "ring-2 ring-primary scale-105"
                  )}
                >
                  <Icon className="w-7 h-7" />
                  <span className="text-sm font-medium">{label}</span>
                </Button>
              ))}
            </div>

            {/* Skip option */}
            <button
              onClick={onSkip}
              className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground py-2 transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Store effort feedback in localStorage for future analysis
 */
export function storeEffortFeedback(
  weekIndex: number,
  taskIndex: number,
  effort: EffortLevel
): void {
  const STORAGE_KEY = 'kaamyab_effort_feedback';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, { effort: EffortLevel; date: string }> = 
      stored ? JSON.parse(stored) : {};
    
    const key = `${weekIndex}-${taskIndex}`;
    data[key] = {
      effort,
      date: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

/**
 * Get effort feedback history
 */
export function getEffortHistory(): Record<string, { effort: EffortLevel; date: string }> {
  const STORAGE_KEY = 'kaamyab_effort_feedback';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
