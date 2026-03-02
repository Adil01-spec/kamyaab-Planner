/**
 * Shared Weekly Breakdown Card
 * Renders week-by-week task breakdown with completion state
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, MessageCirclePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type CollaborationMode } from '@/lib/collaborationMode';

interface WeeklyBreakdownCardProps {
  plan: any;
  mode: CollaborationMode;
  onFeedbackClick?: (target: { type: 'week' | 'task'; ref: string; label: string }) => void;
  canGiveFeedback?: boolean;
}

export function WeeklyBreakdownCard({
  plan,
  mode,
  onFeedbackClick,
  canGiveFeedback = false,
}: WeeklyBreakdownCardProps) {
  const isPrint = mode === 'public_snapshot';

  if (!plan?.weeks?.length) return null;

  return (
    <div className={`space-y-4 ${isPrint ? 'print:break-before-auto' : ''}`}>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className={`w-5 h-5 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
        Weekly Breakdown
      </h2>

      {plan.weeks.map((week: any, weekIndex: number) => {
        const weekCompleted = week.tasks?.filter(
          (t: any) => t.execution_state === 'done' || t.completed
        ).length || 0;
        const weekTotal = week.tasks?.length || 0;
        const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
        const isWeekComplete = weekCompleted === weekTotal && weekTotal > 0;

        return (
          <Card key={weekIndex} className={cn(
            isPrint && 'print:shadow-none print:border-foreground/20',
            isWeekComplete && 'border-primary/30'
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isPrint && 'print:border print:border-foreground/30',
                    isWeekComplete
                      ? `bg-primary text-primary-foreground ${isPrint ? 'print:bg-foreground/10 print:text-foreground' : ''}`
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isWeekComplete ? <CheckCircle2 className="w-4 h-4" /> : week.week}
                  </div>
                  <div>
                    <CardTitle className="text-base">Week {week.week}</CardTitle>
                    <p className="text-sm text-muted-foreground">{week.focus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canGiveFeedback && onFeedbackClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFeedbackClick({ type: 'week', ref: `week-${week.week}`, label: `Week ${week.week}` })}
                      className="text-xs text-muted-foreground h-7 px-2"
                    >
                      <MessageCirclePlus className="w-3 h-3 mr-1" />
                      Feedback
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {weekCompleted}/{weekTotal}
                  </span>
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-primary ${isPrint ? 'print:bg-foreground' : ''} transition-all`}
                      style={{ width: `${weekPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {week.tasks?.map((task: any, taskIndex: number) => {
                  const isCompleted = task.execution_state === 'done' || task.completed;
                  return (
                    <div
                      key={taskIndex}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg',
                        isPrint && 'print:border print:border-foreground/10',
                        isCompleted
                          ? `bg-primary/5 ${isPrint ? 'print:bg-transparent' : ''}`
                          : `bg-muted/30 ${isPrint ? 'print:bg-transparent' : ''}`
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                        isCompleted
                          ? `border-primary bg-primary ${isPrint ? 'print:border-foreground print:bg-foreground' : ''}`
                          : 'border-muted-foreground/30'
                      )}>
                        {isCompleted && <CheckCircle2 className={`w-3 h-3 text-primary-foreground ${isPrint ? 'print:text-background' : ''}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              isPrint && 'print:border-foreground/30 print:text-foreground',
                              task.priority === 'High'
                                ? 'border-destructive/50 text-destructive'
                                : task.priority === 'Medium'
                                ? 'border-primary/50 text-primary'
                                : 'border-muted-foreground/50'
                            )}
                          >
                            {task.priority}
                          </Badge>
                        )}
                        {task.estimated_hours && (
                          <span className="text-xs text-muted-foreground">{task.estimated_hours}h</span>
                        )}
                        {task.duration && (
                          <span className="text-xs text-muted-foreground">{task.duration}</span>
                        )}
                        {canGiveFeedback && onFeedbackClick && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground/50 hover:text-primary"
                            onClick={() => onFeedbackClick({
                              type: 'task',
                              ref: `week-${week.week}-task-${taskIndex}`,
                              label: task.title,
                            })}
                          >
                            <MessageCirclePlus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
