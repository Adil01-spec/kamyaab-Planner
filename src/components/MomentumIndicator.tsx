import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MomentumIndicatorProps {
  weekNumber: number;
  totalWeeks: number;
  weekTasksDone: number;
  weekTasksTotal: number;
  todayTasksDone: number;
  todayTasksTotal: number;
  className?: string;
  variant?: 'full' | 'compact';
}

/**
 * Visual Momentum Indicator
 * Segmented progress with glassmorphism
 * Week → Tasks → Done
 */
export function MomentumIndicator({
  weekNumber,
  totalWeeks,
  weekTasksDone,
  weekTasksTotal,
  todayTasksDone,
  todayTasksTotal,
  className,
  variant = 'full'
}: MomentumIndicatorProps) {
  const weekPercent = totalWeeks > 0 ? (weekNumber / totalWeeks) * 100 : 0;
  const tasksPercent = weekTasksTotal > 0 ? (weekTasksDone / weekTasksTotal) * 100 : 0;
  const todayPercent = todayTasksTotal > 0 ? (todayTasksDone / todayTasksTotal) * 100 : 0;

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Single combined progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/30 backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tasksPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
              }}
            >
              {/* Glow effect on completed portion */}
              {tasksPercent > 0 && (
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 60%, hsl(var(--primary) / 0.4))',
                    filter: 'blur(2px)',
                  }}
                />
              )}
            </motion.div>
          </div>
          <span className="text-xs text-muted-foreground/70 font-medium tabular-nums shrink-0">
            {weekTasksDone}/{weekTasksTotal}
          </span>
        </div>
        <div className="text-xs text-muted-foreground/50 text-center">
          Week {weekNumber} of {totalWeeks}
        </div>
      </div>
    );
  }

  // Full variant with glassmorphism
  return (
    <div className={cn("space-y-4", className)}>
      {/* Today's Progress */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground/60 uppercase tracking-wider font-medium">
            Today
          </span>
          <span className="text-foreground/70 font-medium tabular-nums">
            {todayTasksDone}/{todayTasksTotal}
          </span>
        </div>
        <div 
          className="h-3 rounded-full overflow-hidden relative"
          style={{
            background: 'hsl(var(--muted) / 0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${todayPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: todayPercent > 0 ? '0 0 12px hsl(var(--primary) / 0.4)' : 'none',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
              className="absolute inset-0 w-1/3"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.2), transparent)',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Week Progress */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground/60 uppercase tracking-wider font-medium">
            Week {weekNumber}
          </span>
          <span className="text-foreground/60 font-medium tabular-nums">
            {weekTasksDone}/{weekTasksTotal}
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{
            background: 'hsl(var(--muted) / 0.2)',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${tasksPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="h-full rounded-full"
            style={{
              background: 'hsl(var(--primary) / 0.5)',
              boxShadow: tasksPercent > 0 ? '0 0 8px hsl(var(--primary) / 0.25)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Plan Progress - Segmented visualization */}
      <div className="relative pt-2">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground/50 uppercase tracking-wider font-medium">
            Plan Progress
          </span>
          <span className="text-foreground/50 font-medium">
            Week {weekNumber}/{totalWeeks}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const isCompleted = i < weekNumber - 1;
            const isCurrent = i === weekNumber - 1;
            const currentProgress = isCurrent ? tasksPercent : 0;
            
            return (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full overflow-hidden relative"
                style={{
                  background: 'hsl(var(--muted) / 0.2)',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: isCompleted ? '100%' : isCurrent ? `${currentProgress}%` : '0%' 
                  }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{
                    background: isCompleted 
                      ? 'hsl(var(--primary) / 0.6)' 
                      : 'hsl(var(--primary) / 0.4)',
                    boxShadow: (isCompleted || (isCurrent && currentProgress > 0))
                      ? '0 0 6px hsl(var(--primary) / 0.2)'
                      : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
