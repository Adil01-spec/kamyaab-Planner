/**
 * Plan History Section Component
 * 
 * Main wrapper for plan history and comparison on /review page.
 * Free users see history list, Pro users can compare.
 */

import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, History, Lock } from 'lucide-react';
import { PlanHistoryList } from './PlanHistoryList';
import { PlanComparisonView } from './PlanComparisonView';
import { PatternSignals } from './PatternSignals';
import { ProFeatureIndicator } from './ProFeatureIndicator';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { usePlanHistory, type ComparativeInsights } from '@/hooks/usePlanHistory';
import { 
  calculateCurrentPlanMetrics, 
  calculateComparisonMetrics,
  detectPatterns,
} from '@/lib/planHistoryComparison';
import { toast } from '@/hooks/use-toast';

interface PlanHistorySectionProps {
  userId: string;
  currentPlanId: string | null;
  currentPlan: Record<string, any>;
  currentPlanCreatedAt?: string;
  planData?: { is_strategic_plan?: boolean };
}

export function PlanHistorySection({
  userId,
  currentPlanId,
  currentPlan,
  currentPlanCreatedAt,
  planData,
}: PlanHistorySectionProps) {
  const { 
    history, 
    loading, 
    error, 
    selectedPlan, 
    selectedPlanLoading,
    selectPlanForComparison, 
    clearSelection,
    updateComparisonInsights,
  } = usePlanHistory(userId);

  // Feature access checks
  const { hasAccess: hasComparisonAccess, trackInterest } = useFeatureAccess('plan-comparison', planData);

  // Calculate current plan metrics
  const currentMetrics = useMemo(() => 
    calculateCurrentPlanMetrics(currentPlan, currentPlanCreatedAt),
    [currentPlan, currentPlanCreatedAt]
  );

  // Calculate comparison metrics when a plan is selected
  const comparisonMetrics = useMemo(() => {
    if (!selectedPlan) return null;
    return calculateComparisonMetrics(currentMetrics, selectedPlan);
  }, [currentMetrics, selectedPlan]);

  // Detect patterns across all history
  const patterns = useMemo(() => {
    if (history.length < 3) return [];
    return detectPatterns(history.map(h => ({
      total_tasks: h.total_tasks,
      completed_tasks: h.completed_tasks,
      total_time_seconds: h.total_time_seconds,
      is_strategic: h.is_strategic,
    })));
  }, [history]);

  // Handle plan selection
  const handlePlanSelect = useCallback((planId: string) => {
    if (!hasComparisonAccess) {
      trackInterest('attempted');
      toast({
        title: 'Pro Feature',
        description: 'Plan comparison is available with Strategic Planning.',
      });
      return;
    }
    
    if (planId === 'none') {
      clearSelection();
    } else {
      selectPlanForComparison(planId);
    }
  }, [hasComparisonAccess, trackInterest, selectPlanForComparison, clearSelection]);

  // Handle insights update
  const handleInsightsUpdate = useCallback(async (insights: ComparativeInsights) => {
    if (selectedPlan) {
      await updateComparisonInsights(selectedPlan.id, insights);
    }
  }, [selectedPlan, updateComparisonInsights]);

  // Don't render if still loading and no data yet
  if (loading && history.length === 0) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Plan History</CardTitle>
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible defaultOpen={false}>
      <Card className="glass-card animate-fade-in overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Plan History</CardTitle>
                    {history.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {history.length} past {history.length === 1 ? 'plan' : 'plans'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Compare with past plans
                  </p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Error State */}
            {error && (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            )}

            {/* Plan Selector (Pro Feature) */}
            {history.length > 0 && (
              <div className="flex items-center gap-3">
                <Select 
                  value={selectedPlan?.id || 'none'} 
                  onValueChange={handlePlanSelect}
                  disabled={!hasComparisonAccess}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a plan to compare..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    {history.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.plan_title} ({plan.completion_percent}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {!hasComparisonAccess && (
                  <ProFeatureIndicator featureId="plan-comparison" variant="lock" />
                )}
              </div>
            )}

            {/* Comparison View (when selected) */}
            {selectedPlan && comparisonMetrics && (
              <PlanComparisonView
                currentMetrics={currentMetrics}
                comparisonMetrics={comparisonMetrics}
                selectedPlan={selectedPlan}
                onClose={clearSelection}
                onInsightsUpdate={handleInsightsUpdate}
              />
            )}

            {/* Loading state for selected plan */}
            {selectedPlanLoading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {/* History List */}
            <PlanHistoryList
              history={history}
              loading={loading}
              selectedPlanId={selectedPlan?.id}
              selectionEnabled={hasComparisonAccess}
              onSelectPlan={hasComparisonAccess ? handlePlanSelect : undefined}
            />

            {/* Pattern Signals (Pro Feature) */}
            {hasComparisonAccess && patterns.length > 0 && (
              <div className="pt-3 border-t border-border/50">
                <PatternSignals patterns={patterns} totalPlans={history.length} />
              </div>
            )}

            {/* Pro Upsell for Patterns */}
            {!hasComparisonAccess && history.length >= 3 && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Pattern analysis available with Strategic Planning
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
