import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePlanProgress } from '@/lib/planProgress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SharedReviewContentProps {
  planSnapshot: any;
  projectTitle?: string;
  projectDescription?: string;
}

/**
 * Read-only view of a plan for shared review
 * Excludes timers, start buttons, effort logs, and any editable controls
 */
export function SharedReviewContent({
  planSnapshot,
  projectTitle,
  projectDescription,
}: SharedReviewContentProps) {
  const plan = planSnapshot;
  const progress = calculatePlanProgress(plan);
  const isStrategic = plan?.is_strategic_plan || false;

  if (!plan) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Plan data not available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="space-y-2">
        {projectTitle && (
          <h1 className="text-2xl font-bold text-foreground">{projectTitle}</h1>
        )}
        <p className="text-muted-foreground">{plan.overview}</p>
        <div className="flex items-center gap-2">
          <Badge variant={isStrategic ? 'default' : 'outline'}>
            {isStrategic ? 'Strategic Plan' : 'Standard Plan'}
          </Badge>
          <Badge variant="outline">{plan.total_weeks} Weeks</Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">Progress</span>
            </div>
            <span className="text-2xl font-bold text-primary">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress.completed} of {progress.total} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Strategy Section (Strategic Plans Only) */}
      {isStrategic && plan.strategy_overview && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Strategy Overview</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-primary/5">Strategic</Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Objective */}
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">Objective</h4>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {plan.strategy_overview.objective}
                  </p>
                </div>

                {/* Why Now */}
                {plan.strategy_overview.why_now && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="font-medium text-sm mb-1">Why Now</h4>
                    <p className="text-muted-foreground text-sm">
                      {plan.strategy_overview.why_now}
                    </p>
                  </div>
                )}

                {/* Success Definition */}
                {plan.strategy_overview.success_definition && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium text-sm mb-1">Success Definition</h4>
                    <p className="text-muted-foreground text-sm">
                      {plan.strategy_overview.success_definition}
                    </p>
                  </div>
                )}

                {/* Assumptions */}
                {plan.assumptions && plan.assumptions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Assumptions</h4>
                    <ul className="space-y-1">
                      {plan.assumptions.map((assumption: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {plan.risks && plan.risks.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Risks & Mitigations
                    </h4>
                    <div className="space-y-2">
                      {plan.risks.map((riskItem: any, i: number) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                        >
                          <p className="text-sm font-medium">{riskItem.risk}</p>
                          {riskItem.mitigation && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="text-primary">Mitigation:</span> {riskItem.mitigation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Weekly Task Structure */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Weekly Breakdown
        </h2>

        {plan.weeks?.map((week: any, weekIndex: number) => {
          const weekCompleted = week.tasks?.filter(
            (t: any) => t.execution_state === 'done' || t.completed
          ).length || 0;
          const weekTotal = week.tasks?.length || 0;
          const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
          const isWeekComplete = weekCompleted === weekTotal && weekTotal > 0;

          return (
            <Card key={weekIndex} className={cn(isWeekComplete && 'border-primary/30')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        isWeekComplete
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isWeekComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        week.week
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">Week {week.week}</CardTitle>
                      <p className="text-sm text-muted-foreground">{week.focus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {weekCompleted}/{weekTotal}
                    </span>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
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
                          isCompleted ? 'bg-primary/5' : 'bg-muted/30'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                            isCompleted
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isCompleted && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm truncate',
                              isCompleted && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              task.priority === 'High'
                                ? 'border-destructive/50 text-destructive'
                                : task.priority === 'Medium'
                                ? 'border-primary/50 text-primary'
                                : 'border-muted-foreground/50'
                            )}
                          >
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.estimated_hours}h
                          </span>
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

      {/* Execution Insights (if generated) */}
      {plan.execution_insights && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Execution Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.execution_insights.execution_diagnosis?.primary_mistake && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="text-sm font-medium mb-1">Primary Challenge</h4>
                <p className="text-sm text-muted-foreground">
                  {plan.execution_insights.execution_diagnosis.primary_mistake.label}
                </p>
              </div>
            )}
            {plan.execution_insights.forward_suggestion && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-1">
                  {plan.execution_insights.forward_suggestion.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {plan.execution_insights.forward_suggestion.detail}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reality Check (if generated) */}
      {plan.reality_check && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Reality Check</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  plan.reality_check.feasibility?.assessment === 'realistic'
                    ? 'border-primary/50 text-primary'
                    : plan.reality_check.feasibility?.assessment === 'challenging'
                    ? 'border-yellow-500/50 text-yellow-600'
                    : 'border-destructive/50 text-destructive'
                )}
              >
                {plan.reality_check.feasibility?.assessment}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.reality_check.feasibility?.summary && (
              <p className="text-sm text-muted-foreground">
                {plan.reality_check.feasibility.summary}
              </p>
            )}
            {plan.reality_check.risk_signals?.items?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Risk Signals</h4>
                <div className="space-y-1">
                  {plan.reality_check.risk_signals.items.slice(0, 3).map((risk: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs px-1.5',
                          risk.severity === 'high'
                            ? 'border-destructive/50 text-destructive'
                            : risk.severity === 'medium'
                            ? 'border-yellow-500/50 text-yellow-600'
                            : 'border-muted'
                        )}
                      >
                        {risk.severity}
                      </Badge>
                      <span>{risk.signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
