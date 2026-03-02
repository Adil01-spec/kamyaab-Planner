/**
 * Shared Execution Insights Card
 * Renders execution patterns, forward suggestions, and summary stats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { type CollaborationMode } from '@/lib/collaborationMode';

interface ExecutionMetricsCardProps {
  plan: any;
  mode: CollaborationMode;
}

export function ExecutionMetricsCard({ plan, mode }: ExecutionMetricsCardProps) {
  const isPrint = mode === 'public_snapshot';

  if (!plan?.execution_insights) return null;

  const { execution_insights } = plan;

  return (
    <Card className={isPrint ? 'print:shadow-none print:border-foreground/20' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
          <CardTitle className="text-lg">Execution Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Pattern */}
        {execution_insights.execution_diagnosis?.primary_mistake && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-1">Primary Execution Pattern</h4>
            <p className="text-muted-foreground">
              {execution_insights.execution_diagnosis.primary_mistake.label}
            </p>
            {execution_insights.execution_diagnosis.primary_mistake.description && (
              <p className="text-sm text-muted-foreground/80 mt-1">
                {execution_insights.execution_diagnosis.primary_mistake.description}
              </p>
            )}
          </div>
        )}

        {/* Secondary Pattern */}
        {execution_insights.execution_diagnosis?.secondary_pattern && (
          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="font-medium mb-1">Secondary Pattern</h4>
            <p className="text-muted-foreground">
              {execution_insights.execution_diagnosis.secondary_pattern.label}
            </p>
          </div>
        )}

        {/* Forward Suggestion */}
        {execution_insights.forward_suggestion && (
          <div className={`p-4 rounded-lg bg-primary/5 border border-primary/20 ${isPrint ? 'print:bg-muted/30 print:border-foreground/20' : ''}`}>
            <h4 className="font-medium mb-1">
              {execution_insights.forward_suggestion.title}
            </h4>
            <p className="text-muted-foreground">
              {execution_insights.forward_suggestion.detail}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {execution_insights.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {execution_insights.summary.total_completed !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <span className="text-xl font-bold text-foreground">
                  {execution_insights.summary.total_completed}
                </span>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            )}
            {execution_insights.summary.avg_estimation_accuracy !== undefined && (
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <span className="text-xl font-bold text-foreground">
                  {execution_insights.summary.avg_estimation_accuracy}%
                </span>
                <p className="text-xs text-muted-foreground">Est. Accuracy</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
