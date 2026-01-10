import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Check, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
}

interface HomeFocusCardProps {
  tasks: { task: Task; weekIndex: number; taskIndex: number }[];
  currentWeekNumber: number;
  totalWeeks: number;
  weekCompletedCount: number;
  weekTotalCount: number;
  className?: string;
}

export function HomeFocusCard({ 
  tasks, 
  currentWeekNumber, 
  totalWeeks,
  weekCompletedCount,
  weekTotalCount,
  className 
}: HomeFocusCardProps) {
  const navigate = useNavigate();
  
  const primaryTask = tasks[0];
  const secondaryTasks = tasks.slice(1, 3);
  const allDone = tasks.every(t => t.task.completed);
  const weekProgress = weekTotalCount > 0 ? Math.round((weekCompletedCount / weekTotalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card via-card to-muted/20",
        "border border-border/30 shadow-lg shadow-primary/5",
        className
      )}
    >
      {/* Accent bar */}
      <div className="h-1 gradient-kaamyab" />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
              Your focus today
            </p>
            <p className="text-xs text-muted-foreground/60">
              Week {currentWeekNumber} of {totalWeeks}
            </p>
          </div>
          
          {/* Mini progress ring for the week */}
          <div className="relative w-11 h-11">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray={`${weekProgress * 0.94} 94`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-medium text-foreground/80">
                {weekProgress}%
              </span>
            </div>
          </div>
        </div>

        {allDone ? (
          /* All done state */
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              You're clear for today
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Great progress — enjoy the momentum.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/plan')}
              className="text-xs"
            >
              View Full Plan
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          /* No tasks state */
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Nothing scheduled
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add tasks from your plan to get started.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/plan')}
              className="text-xs"
            >
              Open Plan
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        ) : (
          /* Active tasks */
          <>
            {/* Primary task */}
            {primaryTask && (
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground leading-snug mb-1">
                      {primaryTask.task.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <Clock className="w-3 h-3" />
                      <span>
                        {primaryTask.task.estimated_hours <= 0.5 
                          ? '~30 min' 
                          : `~${primaryTask.task.estimated_hours}h`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary tasks */}
            {secondaryTasks.length > 0 && (
              <div className="space-y-2 mb-5 pl-5">
                {secondaryTasks.map(({ task, weekIndex, taskIndex }) => (
                  <div 
                    key={`${weekIndex}-${taskIndex}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground/70"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={() => navigate('/today')}
              className="w-full gradient-kaamyab hover:opacity-90 h-11"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Start Today
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
