/**
 * Plan History List Component
 * 
 * Displays a list of past plans with summary metrics.
 * Read-only, no execution changes.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { formatDuration } from '@/lib/planHistoryComparison';
import type { PlanHistorySummary } from '@/hooks/usePlanHistory';

interface PlanHistoryListProps {
  history: PlanHistorySummary[];
  loading: boolean;
  onSelectPlan?: (planId: string) => void;
  selectedPlanId?: string | null;
  selectionEnabled?: boolean;
}

export function PlanHistoryList({
  history,
  loading,
  onSelectPlan,
  selectedPlanId,
  selectionEnabled = false,
}: PlanHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No plan history yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Your past plans will appear here after you reset
        </p>
      </div>
    );
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  return (
    <div className="space-y-3">
      {history.map(plan => {
        const isSelected = selectedPlanId === plan.id;
        const canSelect = selectionEnabled && onSelectPlan;
        
        return (
          <Card
            key={plan.id}
            className={`
              transition-all duration-200
              ${canSelect ? 'cursor-pointer hover:border-primary/50' : ''}
              ${isSelected ? 'border-primary bg-primary/5' : 'glass-card'}
            `}
            onClick={() => canSelect && onSelectPlan(plan.id)}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                {/* Left: Title and metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {plan.plan_title}
                    </h4>
                    {plan.is_strategic ? (
                      <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px]">
                        Strategic
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Standard
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateRange(plan.started_at, plan.completed_at)}
                    </span>
                    {plan.scenario_tag && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {plan.scenario_tag}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>{plan.completion_percent}%</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {plan.completed_tasks}/{plan.total_tasks} tasks
                    </span>
                  </div>
                  
                  {plan.total_time_seconds > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{formatDuration(plan.total_time_seconds)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        total time
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
