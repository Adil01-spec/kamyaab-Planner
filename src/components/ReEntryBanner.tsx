/**
 * ReEntryBanner — Phase 9.8
 * 
 * Calm, gentle welcome-back banner for returning users.
 * Displays after 2+ days away with optional resume actions.
 * 
 * Design principles:
 * - No urgency colors (no red, orange)
 * - No streaks, missed-day counts, or gamification
 * - Factual, reassuring language
 * - User must explicitly choose action
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReEntryBannerProps {
  message: string;
  lastProgressFormatted: string | null;
  onDismiss: () => void;
  showActions?: boolean;  // true on /home, false elsewhere
  className?: string;
}

export function ReEntryBanner({
  message,
  lastProgressFormatted,
  onDismiss,
  showActions = true,
  className,
}: ReEntryBannerProps) {
  const navigate = useNavigate();

  const handleResumeToday = () => {
    onDismiss();
    navigate('/today');
  };

  const handleReviewPlan = () => {
    onDismiss();
    navigate('/plan');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5, height: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative rounded-xl overflow-hidden",
          "bg-muted/30 border border-border/20",
          "p-4",
          className
        )}
      >
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground/60" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon - subtle leaf/growth */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-muted-foreground/70" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Main message */}
            <p className="text-sm text-foreground/80 font-medium mb-0.5">
              {message}
            </p>

            {/* Last progress date (soft, factual) */}
            {lastProgressFormatted && (
              <p className="text-xs text-muted-foreground/60">
                You last made progress on {lastProgressFormatted}.
              </p>
            )}

            {/* Optional Resume Actions */}
            {showActions && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeToday}
                  className="text-xs h-8"
                >
                  Resume today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReviewPlan}
                  className="text-xs h-8"
                >
                  Review plan first
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
