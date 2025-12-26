import { useState } from 'react';
import { Lock, Check, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
  explanation?: string;
}

interface WeekCardProps {
  weekNumber: number;
  focus: string;
  tasks: Task[];
  isActive: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  onTaskToggle: (taskIndex: number) => void;
  onAddToCalendar?: () => void;
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

export function WeekCard({
  weekNumber,
  focus,
  tasks,
  isActive,
  isLocked,
  isCompleted,
  onTaskToggle,
  onAddToCalendar,
  totalWeeks,
}: WeekCardProps) {
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
      className={cn(
        "rounded-2xl p-5 transition-all duration-300",
        isActive && "ring-2 ring-primary/30",
        isLocked && "opacity-60",
        isCompleted && !isActive && "opacity-75"
      )}
      style={{
        background: isActive 
          ? 'var(--glass-bg)' 
          : 'hsl(var(--card) / 0.3)',
        backdropFilter: isActive ? 'blur(28px)' : 'blur(12px)',
        WebkitBackdropFilter: isActive ? 'blur(28px)' : 'blur(12px)',
        border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--border) / 0.1)'}`,
        boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-soft)',
      }}
    >
      {/* Week Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-colors",
              isCompleted && "bg-primary/20 text-primary",
              isActive && !isCompleted && "bg-primary text-primary-foreground",
              isLocked && "bg-muted/50 text-muted-foreground"
            )}
          >
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              weekNumber
            )}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold text-foreground",
              isLocked && "text-muted-foreground"
            )}>
              Week {weekNumber}
              {isActive && (
                <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground/80 mt-0.5">
              {focus}
            </p>
          </div>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--muted) / 0.3)"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--dynamic-accent-fill))"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 1.256} 126`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Calendar Button for Active Week */}
      {isActive && onAddToCalendar && (
        <Button
          onClick={onAddToCalendar}
          variant="outline"
          size="sm"
          className="w-full mb-4 border-primary/20 text-primary hover:bg-primary/10"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Add This Week to Calendar
        </Button>
      )}

      {/* Tasks */}
      {!isLocked && (
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={index} className="group">
              <div
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer",
                  task.completed && "opacity-60"
                )}
                style={{
                  background: expandedTasks.has(index) 
                    ? 'hsl(var(--dynamic-accent) / 0.05)' 
                    : 'transparent',
                }}
              >
                <Checkbox
                  checked={task.completed || false}
                  onCheckedChange={() => onTaskToggle(index)}
                  disabled={isLocked}
                  className={cn(
                    "mt-0.5 h-5 w-5 rounded-md border-2 transition-all",
                    task.completed 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground/40 hover:border-primary/60"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-start justify-between"
                    onClick={() => toggleTaskExpansion(index)}
                  >
                    <p className={cn(
                      "text-[15px] font-medium transition-all",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <button 
                      className="ml-2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
                  
                  <div className="flex items-center gap-2 mt-1.5">
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
                        <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">
                              What to do
                            </p>
                            <p className="text-sm text-foreground/80">
                              {task.explanation || generateTaskExplanation(task, 'what')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">
                              How to do it
                            </p>
                            <p className="text-sm text-foreground/80">
                              {generateTaskExplanation(task, 'how')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-1">
                              Why it matters
                            </p>
                            <p className="text-sm text-foreground/80">
                              {generateTaskExplanation(task, 'why')}
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
      )}

      {/* Locked State */}
      {isLocked && (
        <div className="flex items-center justify-center py-6 text-muted-foreground/60">
          <Lock className="w-4 h-4 mr-2" />
          <span className="text-sm">Complete previous weeks to unlock</span>
        </div>
      )}

      {/* Week Progress Bar */}
      <div className="mt-4 pt-3 border-t border-border/10">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 mb-1.5">
          <span>{completedCount} of {tasks.length} tasks</span>
          <span>Week {weekNumber} of {totalWeeks}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </motion.div>
  );
}

// Helper to generate contextual explanations for tasks
function generateTaskExplanation(task: Task, type: 'what' | 'how' | 'why'): string {
  const title = task.title.toLowerCase();
  
  switch (type) {
    case 'what':
      return `Focus on completing "${task.title}" within the estimated ${task.estimated_hours} hours. Break it into smaller steps if needed.`;
    case 'how':
      if (task.priority === 'High') {
        return 'Start with this task first thing. Block dedicated time, minimize distractions, and focus on completing it before moving to lower priority items.';
      }
      return 'Schedule this task when you have a clear block of time. Consider batching similar tasks together for efficiency.';
    case 'why':
      if (task.priority === 'High') {
        return 'This is a high-priority task that directly impacts your weekly goals. Completing it builds momentum and keeps you on track.';
      }
      return 'This task contributes to your overall progress and helps maintain consistent momentum toward your project goals.';
    default:
      return '';
  }
}
