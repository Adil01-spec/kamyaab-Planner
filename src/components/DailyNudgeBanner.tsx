import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyNudgeBannerProps {
  hasUnlockedTasks: boolean;
  hasActiveOrDoneToday: boolean;
  className?: string;
}

const NUDGE_KEY = 'kaamyab_daily_nudge_dismissed';

/**
 * Smart In-App Daily Nudge
 * Shows once per day if:
 * - User has unlocked tasks for current week
 * - No task is marked doing or done today
 */
export function DailyNudgeBanner({ 
  hasUnlockedTasks, 
  hasActiveOrDoneToday,
  className 
}: DailyNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check if banner was already dismissed today
  useEffect(() => {
    setMounted(true);
    const todayKey = new Date().toISOString().split('T')[0];
    const lastDismissed = localStorage.getItem(NUDGE_KEY);
    
    if (lastDismissed !== todayKey) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    const todayKey = new Date().toISOString().split('T')[0];
    localStorage.setItem(NUDGE_KEY, todayKey);
    setDismissed(true);
  };

  // Don't show if:
  // - Already dismissed today
  // - No unlocked tasks
  // - Already working on something today
  // - Not mounted yet
  if (!mounted || dismissed || !hasUnlockedTasks || hasActiveOrDoneToday) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn("overflow-hidden", className)}
      >
        <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
          {/* Icon */}
          <div className="shrink-0">
            <Sparkles className="w-4 h-4 text-primary/70" />
          </div>
          
          {/* Message */}
          <p className="flex-1 text-sm text-foreground/80">
            You've got one small win waiting today.
          </p>
          
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground/60" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
