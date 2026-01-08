import { DailyContext } from '@/lib/dailyContextEngine';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Battery, 
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentStreak } from '@/lib/streakTracker';

interface TodayContextPanelProps {
  context: DailyContext;
}

const getDayTypeLabel = (dayType: DailyContext['dayType']) => {
  switch (dayType) {
    case 'light':
      return { label: 'Light day', icon: Battery, color: 'text-emerald-500' };
    case 'recovery':
      return { label: 'Recovery', icon: Target, color: 'text-blue-500' };
    case 'push':
      return { label: 'Push mode', icon: Flame, color: 'text-primary' };
    default:
      return { label: 'Normal', icon: Zap, color: 'text-muted-foreground' };
  }
};

const getAdaptiveMessage = (context: DailyContext): string => {
  const { dayType, streakDays, hasOverdueTasks } = context;
  
  if (hasOverdueTasks) {
    return "Clear overdue tasks first to regain flow.";
  }
  
  if (dayType === 'recovery') {
    return "One task is enough to restart momentum.";
  }
  
  if (dayType === 'push' && streakDays >= 5) {
    return "You've been consistent. Keep pressure light today.";
  }
  
  if (dayType === 'push') {
    return "Your consistency is building real momentum.";
  }
  
  if (dayType === 'light') {
    return "Fewer tasks today. Focus on quality.";
  }
  
  return "Steady work leads to steady progress.";
};

export function TodayContextPanel({ context }: TodayContextPanelProps) {
  const currentStreak = getCurrentStreak();
  const dayConfig = getDayTypeLabel(context.dayType);
  const Icon = dayConfig.icon;
  const adaptiveMessage = getAdaptiveMessage(context);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-fit space-y-4"
    >
      {/* Context Header */}
      <div className="rounded-2xl border border-border/30 bg-card/50 p-5">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          How you're doing
        </h3>
        
        {/* Streak Display */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {currentStreak}-day streak
              </p>
              <p className="text-xs text-muted-foreground">
                Consecutive days active
              </p>
            </div>
          </div>
        )}
        
        {/* Day Type */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            context.dayType === 'push' ? 'bg-primary/10' : 
            context.dayType === 'recovery' ? 'bg-blue-500/10' :
            context.dayType === 'light' ? 'bg-emerald-500/10' : 'bg-muted/50'
          )}>
            <Icon className={cn("w-5 h-5", dayConfig.color)} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dayConfig.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Today's mode
            </p>
          </div>
        </div>
        
        {/* Adaptive Message */}
        <div className="rounded-xl bg-muted/30 p-3.5">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              {adaptiveMessage}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
