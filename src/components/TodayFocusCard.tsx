import { DailyContext } from '@/lib/dailyContextEngine';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Battery, 
  Flame, 
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayFocusCardProps {
  context: DailyContext;
}

// Icon and color based on day type
const getDayTypeConfig = (dayType: DailyContext['dayType'], hasOverdueTasks: boolean) => {
  if (hasOverdueTasks) {
    return {
      icon: AlertCircle,
      bgClass: 'from-amber-500/10 to-orange-500/5',
      iconClass: 'text-amber-500',
      borderClass: 'border-amber-500/20',
    };
  }
  
  switch (dayType) {
    case 'light':
      return {
        icon: Battery,
        bgClass: 'from-emerald-500/10 to-teal-500/5',
        iconClass: 'text-emerald-500',
        borderClass: 'border-emerald-500/20',
      };
    case 'recovery':
      return {
        icon: Target,
        bgClass: 'from-blue-500/10 to-indigo-500/5',
        iconClass: 'text-blue-500',
        borderClass: 'border-blue-500/20',
      };
    case 'push':
      return {
        icon: Flame,
        bgClass: 'from-primary/10 to-primary/5',
        iconClass: 'text-primary',
        borderClass: 'border-primary/20',
      };
    case 'normal':
    default:
      return {
        icon: Zap,
        bgClass: 'from-muted/50 to-muted/20',
        iconClass: 'text-muted-foreground',
        borderClass: 'border-border/30',
      };
  }
};

export function TodayFocusCard({ context }: TodayFocusCardProps) {
  const config = getDayTypeConfig(context.dayType, context.hasOverdueTasks);
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        "rounded-2xl p-4 sm:p-5 mb-5",
        "bg-gradient-to-br",
        config.bgClass,
        "border",
        config.borderClass
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          "bg-background/60 backdrop-blur-sm"
        )}>
          <Icon className={cn("w-5 h-5", config.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-0.5">
            {context.headline}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {context.subtext}
          </p>
          
          {/* Streak indicator for push days */}
          {context.dayType === 'push' && context.streakDays >= 3 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {context.streakDays}-day streak
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Recovery helper text */}
      {context.dayType === 'recovery' && (
        <p className="text-xs text-muted-foreground/70 mt-3 pl-[52px] italic">
          Completing even one task today keeps you on track.
        </p>
      )}
    </motion.div>
  );
}
