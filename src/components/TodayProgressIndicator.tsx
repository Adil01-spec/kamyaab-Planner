import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TodayProgressIndicatorProps {
  todayCompleted: number;
  todayTotal: number;
  weekCompleted: number;
  weekTotal: number;
  className?: string;
}

/**
 * Visual progress showing Today vs Week - not total plan
 * Gentle, informational - not pushy
 */
export function TodayProgressIndicator({
  todayCompleted,
  todayTotal,
  weekCompleted,
  weekTotal,
  className
}: TodayProgressIndicatorProps) {
  const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Today Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground/60 uppercase tracking-wider">Today</span>
          <span className="text-foreground/70 font-medium">
            {todayCompleted}/{todayTotal}
          </span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${todayPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full gradient-kaamyab rounded-full"
          />
        </div>
      </div>

      {/* Week Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground/60 uppercase tracking-wider">This Week</span>
          <span className="text-foreground/70 font-medium">
            {weekCompleted}/{weekTotal}
          </span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weekPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="h-full bg-primary/50 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
