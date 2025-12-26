import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Week {
  week: number;
  focus: string;
  tasks: { completed?: boolean }[];
}

interface WeekOverviewProps {
  weeks: Week[];
  activeWeekIndex: number;
}

export function WeekOverview({ weeks, activeWeekIndex }: WeekOverviewProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {weeks.map((week, index) => {
        const isActive = index === activeWeekIndex;
        const isCompleted = week.tasks.every(t => t.completed);
        const isLocked = index > activeWeekIndex;
        const completedCount = week.tasks.filter(t => t.completed).length;
        const progressPercent = week.tasks.length > 0 
          ? Math.round((completedCount / week.tasks.length) * 100) 
          : 0;

        return (
          <motion.div
            key={week.week}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all cursor-default",
              isActive && "ring-2 ring-primary/40",
              isLocked && "opacity-50",
              isCompleted && !isActive && "bg-primary/10"
            )}
            style={{
              background: isActive 
                ? 'hsl(var(--primary) / 0.15)' 
                : isCompleted 
                  ? 'hsl(var(--primary) / 0.08)'
                  : 'hsl(var(--muted) / 0.3)',
              border: `1px solid ${
                isActive 
                  ? 'hsl(var(--primary) / 0.3)' 
                  : 'hsl(var(--border) / 0.1)'
              }`,
            }}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 text-primary" />
            ) : isLocked ? (
              <Lock className="w-3 h-3 text-muted-foreground/60" />
            ) : (
              <>
                <span className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {week.week}
                </span>
                {!isLocked && progressPercent > 0 && progressPercent < 100 && (
                  <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                    <div 
                      className="h-full bg-primary/60 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
