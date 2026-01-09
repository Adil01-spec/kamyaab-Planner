import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Target, Calendar, CheckCircle2, Circle, MinusCircle } from 'lucide-react';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanFlowViewProps {
  weeks: Week[];
  identityStatement?: string;
  projectTitle?: string;
  className?: string;
}

export const PlanFlowView = ({
  weeks,
  identityStatement,
  projectTitle,
  className
}: PlanFlowViewProps) => {
  const flowData = useMemo(() => {
    return weeks.map(week => ({
      ...week,
      allCompleted: week.tasks.every(t => t.completed),
      someCompleted: week.tasks.some(t => t.completed) && !week.tasks.every(t => t.completed),
      completedCount: week.tasks.filter(t => t.completed).length
    }));
  }, [weeks]);

  const getNodeStyles = (completed: boolean, skipped: boolean = false) => {
    if (completed) {
      return 'bg-primary/10 border-primary/30 text-primary';
    }
    if (skipped) {
      return 'bg-muted/30 border-dashed border-muted-foreground/30 text-muted-foreground/50';
    }
    return 'bg-card border-border text-foreground';
  };

  const getTaskIcon = (completed?: boolean) => {
    if (completed) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;
    }
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />;
  };

  return (
    <div className={cn("relative py-8 overflow-x-auto", className)}>
      <div className="min-w-[600px] px-4">
        {/* Root Node - Plan/Goal */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/5">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center max-w-[280px]">
              <p className="font-semibold text-foreground text-sm">
                {projectTitle || 'Your Plan'}
              </p>
              {identityStatement && (
                <p className="text-xs text-muted-foreground/70 mt-1 italic">
                  "{identityStatement}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Connector line from root */}
        <div className="flex justify-center mb-4">
          <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-border" />
        </div>

        {/* Weeks Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {flowData.map((week) => (
            <div key={week.week} className="relative">
              {/* Week Node */}
              <div
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  getNodeStyles(week.allCompleted)
                )}
              >
                {/* Week Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                      week.allCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {week.week}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Week {week.week}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{week.focus}</p>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-1.5">
                  {week.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className={cn(
                        "flex items-start gap-2 py-1.5 px-2 rounded-lg transition-all text-xs",
                        task.completed
                          ? "bg-primary/5 text-muted-foreground/60"
                          : "bg-muted/30 text-foreground/80"
                      )}
                    >
                      {getTaskIcon(task.completed)}
                      <span
                        className={cn(
                          "flex-1 leading-tight line-clamp-2",
                          task.completed && "line-through"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week Progress */}
                <div className="mt-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{week.completedCount}/{week.tasks.length} tasks</span>
                    <span>{Math.round((week.completedCount / week.tasks.length) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Circle className="w-4 h-4 text-muted-foreground/50" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MinusCircle className="w-4 h-4 text-muted-foreground/30" />
            <span>Skipped</span>
          </div>
        </div>
      </div>
    </div>
  );
};
