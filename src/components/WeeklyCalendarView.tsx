import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTaskEventDate, getPlanStartDate } from '@/lib/calendarService';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface WeeklyCalendarViewProps {
  weeks: Week[];
  planCreatedAt?: string;
  activeWeekIndex: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-destructive/20 border-destructive/30 text-destructive';
    case 'Medium':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400';
    case 'Low':
      return 'bg-primary/20 border-primary/30 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

interface ScheduledTask extends Task {
  weekNumber: number;
  taskIndex: number;
  scheduledDate: Date;
}

export function WeeklyCalendarView({ weeks, planCreatedAt, activeWeekIndex }: WeeklyCalendarViewProps) {
  const planStartDate = useMemo(() => getPlanStartDate(planCreatedAt), [planCreatedAt]);
  
  // Get the current week's start (Monday)
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  }, []);
  
  // Generate 7 days for the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);
  
  // Calculate all scheduled tasks with their dates
  const scheduledTasks = useMemo(() => {
    const tasks: ScheduledTask[] = [];
    
    weeks.forEach((week, weekIndex) => {
      week.tasks.forEach((task, taskIndex) => {
        const scheduledDate = calculateTaskEventDate(planStartDate, week.week, taskIndex);
        tasks.push({
          ...task,
          weekNumber: week.week,
          taskIndex,
          scheduledDate,
        });
      });
    });
    
    return tasks;
  }, [weeks, planStartDate]);
  
  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const grouped: Map<string, ScheduledTask[]> = new Map();
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayTasks = scheduledTasks.filter(task => 
        isSameDay(task.scheduledDate, day)
      );
      grouped.set(dayKey, dayTasks);
    });
    
    return grouped;
  }, [weekDays, scheduledTasks]);
  
  // Count tasks for the week
  const weekStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    
    tasksByDay.forEach(tasks => {
      total += tasks.length;
      completed += tasks.filter(t => t.completed).length;
    });
    
    return { total, completed };
  }, [tasksByDay]);

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">This Week's Schedule</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {weekStats.completed}/{weekStats.total} tasks
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2 min-w-max">
            {weekDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDay.get(dayKey) || [];
              const isCurrentDay = isToday(day);
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
              
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "flex-1 min-w-[140px] rounded-xl border p-3 transition-all",
                    isCurrentDay 
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" 
                      : "border-border/50 bg-card/50",
                    isPast && !isCurrentDay && "opacity-60"
                  )}
                >
                  {/* Day header */}
                  <div className="text-center mb-3">
                    <p className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      isCurrentDay ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={cn(
                      "text-2xl font-bold",
                      isCurrentDay ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, 'd')}
                    </p>
                    {isCurrentDay && (
                      <Badge className="mt-1 text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                        Today
                      </Badge>
                    )}
                  </div>
                  
                  {/* Tasks for the day */}
                  <div className="space-y-2">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 text-center py-2">
                        No tasks
                      </p>
                    ) : (
                      dayTasks.map((task, taskIdx) => (
                        <div
                          key={`${task.weekNumber}-${task.taskIndex}-${taskIdx}`}
                          className={cn(
                            "p-2 rounded-lg border text-xs transition-all",
                            task.completed 
                              ? "bg-primary/10 border-primary/20 opacity-70" 
                              : getPriorityColor(task.priority)
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            {task.completed && (
                              <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                            )}
                            <span className={cn(
                              "font-medium line-clamp-2 leading-tight",
                              task.completed && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] opacity-70">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {task.estimated_hours}h
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              W{task.weekNumber}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}