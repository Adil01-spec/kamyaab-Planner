import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type EffortLevel } from './TaskEffortFeedback';

interface DayClosureModalProps {
  open: boolean;
  onClose: () => void;
  completedCount: number;
  effortSummary: { easy: number; okay: number; hard: number };
}

// Reflective prompts that encourage without pushing
const reflectivePrompts = [
  "What helped you today?",
  "What made progress easier?",
  "What will you carry into tomorrow?",
  "What worked well for you?",
  "Any small win worth noting?",
];

// Get today's prompt (consistent per day)
const getTodayPrompt = (): string => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return reflectivePrompts[dayOfYear % reflectivePrompts.length];
};

// Effort summary label
const getEffortSummaryLabel = (summary: { easy: number; okay: number; hard: number }): string => {
  const total = summary.easy + summary.okay + summary.hard;
  if (total === 0) return '';
  
  if (summary.hard > summary.easy && summary.hard >= summary.okay) {
    return 'A challenging day — well done pushing through.';
  }
  if (summary.easy > summary.hard && summary.easy >= summary.okay) {
    return 'Smooth sailing today — nice flow.';
  }
  return 'A balanced day of work.';
};

export function DayClosureModal({ 
  open, 
  onClose, 
  completedCount,
  effortSummary
}: DayClosureModalProps) {
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const prompt = getTodayPrompt();
  const effortLabel = getEffortSummaryLabel(effortSummary);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setReflection('');
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (reflection.trim()) {
      // Store the reflection
      const STORAGE_KEY = 'kaamyab_day_closure';
      try {
        const data = {
          date: new Date().toISOString().split('T')[0],
          reflection: reflection.trim(),
          completedCount,
          effortSummary,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Silently fail
      }
    }
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "w-full max-w-md mx-4",
              "bg-card rounded-3xl border border-border/30 shadow-2xl",
              "p-8 relative overflow-hidden"
            )}
          >
            {/* Subtle gradient accent */}
            <div className="absolute inset-x-0 top-0 h-1 gradient-kaamyab" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Moon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Header */}
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Day complete.
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {completedCount} task{completedCount !== 1 ? 's' : ''} done today.
                    {effortLabel && <span className="block mt-1 text-xs">{effortLabel}</span>}
                  </p>

                  {/* Reflective prompt */}
                  <div className="text-left mb-4">
                    <label className="text-sm font-medium text-foreground/80 block mb-2">
                      {prompt}
                    </label>
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="Optional — share a thought..."
                      className="min-h-[80px] resize-none bg-muted/30 border-border/30 focus:border-primary/40"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 gradient-kaamyab hover:opacity-90"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Rest well.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See you tomorrow.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
