/**
 * Plan Comparison View Component
 * 
 * Displays side-by-side comparison metrics and AI insights.
 * Read-only, observational only.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpRight, ArrowDownRight, Minus, X, Loader2, 
  Sparkles, TrendingUp, CheckCircle2, Clock, ListTodo
} from 'lucide-react';
import { 
  type ComparisonMetrics, 
  type CurrentPlanMetrics,
  formatDuration, 
  getDeltaIndicator 
} from '@/lib/planHistoryComparison';
import type { PlanHistoryFull, ComparativeInsights } from '@/hooks/usePlanHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PlanComparisonViewProps {
  currentMetrics: CurrentPlanMetrics;
  comparisonMetrics: ComparisonMetrics;
  selectedPlan: PlanHistoryFull;
  onClose: () => void;
  onInsightsUpdate: (insights: ComparativeInsights) => void;
}

export function PlanComparisonView({
  currentMetrics,
  comparisonMetrics,
  selectedPlan,
  onClose,
  onInsightsUpdate,
}: PlanComparisonViewProps) {
  const [insights, setInsights] = useState<ComparativeInsights | null>(selectedPlan.comparison_insights);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const generateInsights = useCallback(async () => {
    setLoadingInsights(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('plan-comparison-insights', {
        body: {
          current: {
            totalTasks: currentMetrics.totalTasks,
            completedTasks: currentMetrics.completedTasks,
            completionPercent: currentMetrics.completionPercent,
            totalTimeSeconds: currentMetrics.totalTimeSeconds,
            isStrategic: currentMetrics.isStrategic,
          },
          previous: {
            id: selectedPlan.id,
            totalTasks: selectedPlan.total_tasks,
            completedTasks: selectedPlan.completed_tasks,
            completionPercent: selectedPlan.completion_percent,
            totalTimeSeconds: selectedPlan.total_time_seconds,
            isStrategic: selectedPlan.is_strategic,
            title: selectedPlan.plan_title,
          },
          deltas: {
            taskCount: comparisonMetrics.taskCountDelta.delta,
            completionRate: comparisonMetrics.completionRateDelta.delta,
            totalTime: comparisonMetrics.totalTimeDelta.delta,
          },
        },
      });

      if (error) throw error;

      const newInsights: ComparativeInsights = {
        observations: data.observations || [],
        pattern_note: data.pattern_note,
        generated_at: new Date().toISOString(),
        plans_compared: ['current', selectedPlan.id],
      };

      setInsights(newInsights);
      onInsightsUpdate(newInsights);
    } catch (err) {
      console.error('Error generating insights:', err);
      toast({
        title: 'Could not generate insights',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingInsights(false);
    }
  }, [currentMetrics, selectedPlan, comparisonMetrics, onInsightsUpdate]);

  const DeltaIcon = ({ direction }: { direction: 'up' | 'down' | 'neutral' }) => {
    switch (direction) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-primary" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="glass-card border-primary/20 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Comparing with: {selectedPlan.plan_title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(selectedPlan.completed_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Task Count */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <ListTodo className="w-3 h-3" />
              Tasks
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currentMetrics.totalTasks}</span>
              <div className="flex items-center gap-0.5 text-xs">
                <DeltaIcon direction={comparisonMetrics.taskCountDelta.direction} />
                <span className={
                  comparisonMetrics.taskCountDelta.direction === 'up' ? 'text-primary' : 'text-muted-foreground'
                }>
                  {comparisonMetrics.taskCountDelta.delta > 0 ? '+' : ''}
                  {comparisonMetrics.taskCountDelta.delta}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              vs {selectedPlan.total_tasks}
            </span>
          </div>

          {/* Completion Rate */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="w-3 h-3" />
              Completion
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currentMetrics.completionPercent}%</span>
              <div className="flex items-center gap-0.5 text-xs">
                <DeltaIcon direction={comparisonMetrics.completionRateDelta.direction} />
                <span className={
                  comparisonMetrics.completionRateDelta.direction === 'up' ? 'text-primary' : 'text-muted-foreground'
                }>
                  {comparisonMetrics.completionRateDelta.delta > 0 ? '+' : ''}
                  {comparisonMetrics.completionRateDelta.delta}%
                </span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              vs {selectedPlan.completion_percent}%
            </span>
          </div>

          {/* Total Time */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              Time Spent
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{formatDuration(currentMetrics.totalTimeSeconds)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              vs {formatDuration(selectedPlan.total_time_seconds)}
            </span>
          </div>

          {/* Plan Type */}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Plan Type</div>
            <div className="flex flex-col gap-1">
              <Badge 
                className={currentMetrics.isStrategic 
                  ? 'bg-primary/10 text-primary border-primary/20 text-[10px]' 
                  : 'text-[10px]'
                }
                variant={currentMetrics.isStrategic ? 'default' : 'outline'}
              >
                {currentMetrics.isStrategic ? 'Strategic' : 'Standard'}
              </Badge>
              {comparisonMetrics.strategicComparison.upgraded && (
                <span className="text-[10px] text-primary flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Upgraded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Comparative Insights
            </h4>
            {!insights && !loadingInsights && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={generateInsights}
                className="text-xs"
              >
                Generate
              </Button>
            )}
          </div>

          {loadingInsights ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : insights ? (
            <div className="space-y-2">
              {insights.observations.map((observation, i) => (
                <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{observation}</span>
                </p>
              ))}
              {insights.pattern_note && (
                <p className="text-sm text-muted-foreground/80 italic mt-3 pl-4 border-l-2 border-primary/30">
                  {insights.pattern_note}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Generated {new Date(insights.generated_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70 text-center py-3">
              Click "Generate" to get AI-powered observations
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
