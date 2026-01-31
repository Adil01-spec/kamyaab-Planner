/**
 * Advisor View Content Component
 * 
 * Professional, read-only presentation of plan data for advisors/mentors.
 * Designed to be calm, informative, and print-friendly.
 * 
 * STRICTLY EXCLUDED:
 * - No timers
 * - No execution buttons
 * - No editing controls
 * - No reordering
 * - No comments
 * - No suggestions
 * - No AI regeneration
 * - No user identifiers
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Shield,
  BarChart3,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePlanProgress } from '@/lib/planProgress';
import { formatExpiryDate, getDaysUntilExpiry } from '@/lib/shareReview';

interface AdvisorViewContentProps {
  planSnapshot: any;
  expiresAt: string;
}

export function AdvisorViewContent({
  planSnapshot,
  expiresAt,
}: AdvisorViewContentProps) {
  const plan = planSnapshot;
  const progress = calculatePlanProgress(plan);
  const isStrategic = plan?.is_strategic_plan || false;
  const daysRemaining = getDaysUntilExpiry(expiresAt);

  if (!plan) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Plan data not available.
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Access Info - Print hidden */}
      <div className="text-xs text-muted-foreground text-right print:hidden">
        <Clock className="w-3 h-3 inline mr-1" />
        Access expires {formatExpiryDate(expiresAt)} ({daysRemaining} days remaining)
      </div>

      {/* 1. Plan Overview */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {plan.overview || 'Plan Overview'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {isStrategic ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 print:bg-transparent print:border-foreground/30 print:text-foreground">
                  Strategic Plan
                </Badge>
              ) : (
                <Badge variant="outline">Standard Plan</Badge>
              )}
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                {plan.total_weeks} Weeks
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="print:shadow-none print:border-foreground/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary print:text-foreground" />
                <span className="font-medium">Overall Progress</span>
              </div>
              <span className="text-2xl font-bold text-primary print:text-foreground">
                {progress.percent}%
              </span>
            </div>
            <Progress value={progress.percent} className="h-2 print:bg-muted" />
            <p className="text-sm text-muted-foreground mt-2">
              {progress.completed} of {progress.total} tasks completed
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. Strategy Overview (Strategic Plans Only) */}
      {isStrategic && plan.strategy_overview && (
        <section className="print:break-before-auto">
          <Card className="print:shadow-none print:border-foreground/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary print:text-foreground" />
                <CardTitle className="text-lg">Strategy Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Objective */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 print:bg-muted/30 print:border-foreground/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary print:text-foreground" />
                  <h4 className="font-medium">Objective</h4>
                </div>
                <p className="text-muted-foreground">
                  {plan.strategy_overview.objective}
                </p>
              </div>

              {/* Why Now */}
              {plan.strategy_overview.why_now && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Why Now</h4>
                  <p className="text-muted-foreground">
                    {plan.strategy_overview.why_now}
                  </p>
                </div>
              )}

              {/* Success Definition */}
              {plan.strategy_overview.success_definition && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Success Definition</h4>
                  <p className="text-muted-foreground">
                    {plan.strategy_overview.success_definition}
                  </p>
                </div>
              )}

              {/* Assumptions */}
              {plan.assumptions && plan.assumptions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Assumptions</h4>
                  <ul className="space-y-1">
                    {plan.assumptions.map((assumption: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary print:text-foreground">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {plan.risks && plan.risks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive print:text-foreground" />
                    Identified Risks
                  </h4>
                  <div className="space-y-2">
                    {plan.risks.map((riskItem: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 print:bg-muted/30 print:border-foreground/20"
                      >
                        <p className="font-medium">{riskItem.risk}</p>
                        {riskItem.mitigation && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Mitigation:</span> {riskItem.mitigation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* 3. Plan Reality Check */}
      {plan.reality_check && (
        <section className="print:break-before-auto">
          <Card className="print:shadow-none print:border-foreground/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary print:text-foreground" />
                  <CardTitle className="text-lg">Reality Check</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs print:text-foreground print:border-foreground/30',
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
            <CardContent className="space-y-4">
              {plan.reality_check.feasibility?.summary && (
                <p className="text-muted-foreground">
                  {plan.reality_check.feasibility.summary}
                </p>
              )}
              
              {/* Risk Signals */}
              {plan.reality_check.risk_signals?.items?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Risk Signals</h4>
                  <div className="space-y-2">
                    {plan.reality_check.risk_signals.items.map((risk: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs shrink-0 mt-0.5',
                            risk.severity === 'high'
                              ? 'border-destructive/50 text-destructive'
                              : risk.severity === 'medium'
                              ? 'border-yellow-500/50 text-yellow-600'
                              : 'border-muted'
                          )}
                        >
                          {risk.severity}
                        </Badge>
                        <span className="text-muted-foreground">{risk.signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Gaps */}
              {plan.reality_check.focus_gaps?.items?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Focus Gaps</h4>
                  <ul className="space-y-1">
                    {plan.reality_check.focus_gaps.items.map((gap: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary print:text-foreground">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategic Blind Spots */}
              {plan.reality_check.focus_gaps?.strategic_blind_spots?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Strategic Blind Spots</h4>
                  <ul className="space-y-1">
                    {plan.reality_check.focus_gaps.strategic_blind_spots.map((spot: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-destructive print:text-foreground">•</span>
                        {spot}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* 4. Execution Insights */}
      {plan.execution_insights && (
        <section className="print:break-before-auto">
          <Card className="print:shadow-none print:border-foreground/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary print:text-foreground" />
                <CardTitle className="text-lg">Execution Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Execution Pattern */}
              {plan.execution_insights.execution_diagnosis?.primary_mistake && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-1">Primary Execution Pattern</h4>
                  <p className="text-muted-foreground">
                    {plan.execution_insights.execution_diagnosis.primary_mistake.label}
                  </p>
                  {plan.execution_insights.execution_diagnosis.primary_mistake.description && (
                    <p className="text-sm text-muted-foreground/80 mt-1">
                      {plan.execution_insights.execution_diagnosis.primary_mistake.description}
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Pattern */}
              {plan.execution_insights.execution_diagnosis?.secondary_pattern && (
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-1">Secondary Pattern</h4>
                  <p className="text-muted-foreground">
                    {plan.execution_insights.execution_diagnosis.secondary_pattern.label}
                  </p>
                </div>
              )}

              {/* Forward Suggestion */}
              {plan.execution_insights.forward_suggestion && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 print:bg-muted/30 print:border-foreground/20">
                  <h4 className="font-medium mb-1">
                    {plan.execution_insights.forward_suggestion.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {plan.execution_insights.forward_suggestion.detail}
                  </p>
                </div>
              )}

              {/* Summary Stats */}
              {plan.execution_insights.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {plan.execution_insights.summary.total_completed !== undefined && (
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <span className="text-xl font-bold text-foreground">
                        {plan.execution_insights.summary.total_completed}
                      </span>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  )}
                  {plan.execution_insights.summary.avg_estimation_accuracy !== undefined && (
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <span className="text-xl font-bold text-foreground">
                        {plan.execution_insights.summary.avg_estimation_accuracy}%
                      </span>
                      <p className="text-xs text-muted-foreground">Est. Accuracy</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* 5. Planning Style Profile (if available) */}
      {plan.planning_style_profile && (
        <section className="print:break-before-auto">
          <Card className="print:shadow-none print:border-foreground/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary print:text-foreground" />
                <CardTitle className="text-lg">Planning Style</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Style Summary */}
              {plan.planning_style_profile.summary && (
                <p className="text-muted-foreground italic">
                  "{plan.planning_style_profile.summary}"
                </p>
              )}

              {/* Style Dimensions */}
              {plan.planning_style_profile.dimensions && (
                <div className="space-y-3 pt-2">
                  <AdvisorStyleDimension
                    left="Planner"
                    right="Improviser"
                    value={plan.planning_style_profile.dimensions.planAdherence}
                  />
                  <AdvisorStyleDimension
                    left="Optimistic"
                    right="Conservative"
                    value={plan.planning_style_profile.dimensions.estimationBias}
                  />
                  <AdvisorStyleDimension
                    left="Linear"
                    right="Iterative"
                    value={plan.planning_style_profile.dimensions.executionPattern}
                  />
                  <AdvisorStyleDimension
                    left="Strategic"
                    right="Tactical"
                    value={plan.planning_style_profile.dimensions.planningScope}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Based on {plan.planning_style_profile.plans_analyzed || 'multiple'} completed plans.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 6. Weekly Structure Summary */}
      <section className="print:break-before-auto">
        <Card className="print:shadow-none print:border-foreground/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary print:text-foreground" />
              <CardTitle className="text-lg">Weekly Structure</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.weeks?.map((week: any, i: number) => {
                const weekCompleted = week.tasks?.filter(
                  (t: any) => t.execution_state === 'done' || t.completed
                ).length || 0;
                const weekTotal = week.tasks?.length || 0;
                const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 print:bg-transparent print:border print:border-foreground/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium print:bg-muted">
                        {week.week}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{week.focus}</p>
                        <p className="text-xs text-muted-foreground">
                          {weekTotal} tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary print:bg-foreground transition-all"
                          style={{ width: `${weekPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {weekPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer */}
      <Separator className="print:hidden" />
      <p className="text-xs text-muted-foreground text-center print:text-left print:mt-8">
        This is a read-only view shared for advisory purposes.
        No personal identifiers are exposed. Link expires {formatExpiryDate(expiresAt)}.
      </p>
    </div>
  );
}

/**
 * Style dimension bar for advisor view
 */
function AdvisorStyleDimension({
  left,
  right,
  value,
}: {
  left: string;
  right: string;
  value: number;
}) {
  // Value is 0-1, where 0 = left, 1 = right
  const position = Math.max(0, Math.min(1, value || 0.5)) * 100;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-right text-muted-foreground">{left}</span>
      <div className="flex-1 h-2 bg-muted rounded-full relative">
        <div
          className="absolute w-3 h-3 rounded-full bg-primary print:bg-foreground -top-0.5 transition-all"
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
      <span className="w-24 text-muted-foreground">{right}</span>
    </div>
  );
}
