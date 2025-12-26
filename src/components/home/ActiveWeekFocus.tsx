import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
}

interface ActiveWeekFocusProps {
  weekNumber: number;
  focus: string;
  tasks: Task[];
  onTaskToggle: (taskIndex: number) => void;
  onAddToCalendar: () => void;
  totalWeeks: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'low':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ActiveWeekFocus({
  weekNumber,
  focus,
  tasks,
  onTaskToggle,
  onAddToCalendar,
  totalWeeks,
}: ActiveWeekFocusProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const toggleTaskExpansion = (index: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 md:p-6 ring-2 ring-primary/20"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid hsl(var(--primary) / 0.15)',
        boxShadow: 'var(--shadow-glow), 0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Accent Gradient Top */}
      <div 
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--dynamic-accent) / 0.5), transparent)',
        }}
      />

      {/* Week Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--muted) / 0.2)"
                strokeWidth="6"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.83} 283`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
              {progressPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Week {weekNumber}
              </h2>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
              {focus}
            </p>
          </div>
        </div>

        {/* Calendar Button */}
        <Button
          onClick={onAddToCalendar}
          size="sm"
          className="w-full sm:w-auto gradient-kaamyab text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div 
            key={index} 
            className={cn(
              "rounded-xl transition-all",
              expandedTasks.has(index) && "bg-muted/30"
            )}
          >
            <div className="flex items-start gap-3 p-3 cursor-pointer">
              <Checkbox
                checked={task.completed || false}
                onCheckedChange={() => onTaskToggle(index)}
                className={cn(
                  "mt-0.5 h-5 w-5 rounded-md border-2 transition-all flex-shrink-0",
                  task.completed 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/40 hover:border-primary/60"
                )}
              />
              
              <div className="flex-1 min-w-0">
                <div 
                  className="flex items-start justify-between gap-2"
                  onClick={() => toggleTaskExpansion(index)}
                >
                  <div className="flex-1">
                    <p className={cn(
                      "text-[15px] font-medium transition-all leading-snug",
                      task.completed && "line-through text-muted-foreground/60"
                    )}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        getPriorityColor(task.priority)
                      )}>
                        {task.priority}
                      </span>
                      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_hours}h
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-lg hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskExpansion(index);
                    }}
                  >
                    {expandedTasks.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expandable Explanation */}
                <AnimatePresence>
                  {expandedTasks.has(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            What to do
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            Break down "{task.title}" into manageable steps. Allocate {task.estimated_hours} hours of focused work time.
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                            How to do it
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {task.priority === 'High' 
                              ? 'Prioritize this task first. Block dedicated time, minimize distractions, and complete before moving on.'
                              : 'Schedule focused time blocks. Consider batching with similar tasks for better efficiency.'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                            Why it matters
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {task.priority === 'High'
                              ? 'High-priority tasks directly impact your weekly goals. Completing them builds momentum.'
                              : 'Every completed task moves you closer to your goal and maintains consistent progress.'
                            }
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Week Progress Footer */}
      <div className="mt-4 pt-4 border-t border-border/10">
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 mb-2">
          <span>{completedCount} of {tasks.length} tasks completed</span>
          <span>Week {weekNumber} of {totalWeeks}</span>
        </div>
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'hsl(var(--muted) / 0.25)' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercent}%`,
              background: 'hsl(var(--primary))',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
