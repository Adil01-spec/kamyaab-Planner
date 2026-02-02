import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, X, Send, Clock, CheckCircle2, ArrowRight, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  type DaySummary,
  generateAcknowledgement,
  formatTimeSpent,
  formatSummaryText,
  getTodayReflectionPrompt,
} from '@/lib/dayClosure';

interface DayClosureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reflection?: string) => Promise<void>;
  summary: DaySummary;
  isLoading?: boolean;
  // Legacy props for backward compat
  completedCount?: number;
  effortSummary?: { easy: number; okay: number; hard: number };
}

export function DayClosureModal({ 
  open, 
  onClose,
  onConfirm,
  summary,
  isLoading = false,
  completedCount,
  effortSummary,
}: DayClosureModalProps) {
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Use new summary if available, fallback to legacy
  const displaySummary: DaySummary = summary || {
    completed: completedCount || 0,
    partial: 0,
    deferred: 0,
    total_time_seconds: 0,
  };
  
  const prompt = getTodayReflectionPrompt();
  const acknowledgement = generateAcknowledgement(displaySummary);
  const summaryText = formatSummaryText(displaySummary);
  const timeText = formatTimeSpent(displaySummary.total_time_seconds);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setReflection('');
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setSubmitted(true);
    await onConfirm(reflection.trim() || undefined);
    setTimeout(onClose, 1500);
  };

  const handleSkip = async () => {
    setSubmitted(true);
    await onConfirm(undefined);
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
                    Close your day
                  </h2>
                  
                  {/* Acknowledgement */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {acknowledgement}
                  </p>

                  {/* Summary Stats */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {displaySummary.completed > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{displaySummary.completed} done</span>
                      </div>
                    )}
                    {displaySummary.partial > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Pause className="w-4 h-4 text-amber-500" />
                        <span className="text-foreground">{displaySummary.partial} in progress</span>
                      </div>
                    )}
                    {displaySummary.deferred > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{displaySummary.deferred} moved</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Time spent */}
                  {timeText && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-6">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeText}</span>
                    </div>
                  )}

                  {/* Reflective prompt */}
                  <div className="text-left mb-4">
                    <label className="text-sm font-medium text-foreground/80 block mb-2">
                      {prompt}
                    </label>
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value.slice(0, 200))}
                      placeholder="Optional — share a thought..."
                      className="min-h-[80px] resize-none bg-muted/30 border-border/30 focus:border-primary/40"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground/60 text-right mt-1">
                      {reflection.length}/200
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
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
