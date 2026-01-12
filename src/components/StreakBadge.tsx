import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  className?: string;
  variant?: 'default' | 'compact' | 'prominent';
}

/**
 * Focus Streak Badge
 * Shows streak count with subtle animation on increment
 * No guilt language - just quiet celebration
 */
export function StreakBadge({ streak, className, variant = 'default' }: StreakBadgeProps) {
  if (streak <= 0) return null;

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-muted-foreground/60", className)}>
        <Flame className="w-3 h-3 text-orange-400/70" />
        <span>{streak}d</span>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
          "border border-orange-400/20",
          className
        )}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Flame className="w-4 h-4 text-orange-400" />
        </motion.div>
        <span className="text-sm font-medium text-foreground/80">
          {streak} day{streak !== 1 ? 's' : ''}
        </span>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
        "bg-orange-500/10 border border-orange-400/15",
        className
      )}
    >
      <motion.div
        animate={{ 
          rotate: [0, -8, 8, 0],
        }}
        transition={{ 
          duration: 0.5,
          delay: 0.2,
        }}
      >
        <Flame className="w-3.5 h-3.5 text-orange-400" />
      </motion.div>
      <span className="text-xs font-medium text-foreground/70">
        {streak}
      </span>
    </motion.div>
  );
}
