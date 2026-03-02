/**
 * Shared Plan Overview Card
 * Used across all review modes (SharedReview, AdvisorView, SoftCollabReview, Review)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Calendar } from 'lucide-react';
import { calculatePlanProgress } from '@/lib/planProgress';
import { type CollaborationMode } from '@/lib/collaborationMode';

interface PlanOverviewCardProps {
  plan: any;
  mode: CollaborationMode;
  projectTitle?: string;
  planCreatedAt?: string;
  scenarioLabel?: string;
}

export function PlanOverviewCard({
  plan,
  mode,
  projectTitle,
  planCreatedAt,
  scenarioLabel,
}: PlanOverviewCardProps) {
  const progress = calculatePlanProgress(plan);
  const isStrategic = plan?.is_strategic_plan || false;
  const isPrint = mode === 'public_snapshot';

  return (
    <Card className={isPrint ? 'print:shadow-none print:border-foreground/20' : 'glass-card'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">
              {projectTitle || plan?.overview || 'Plan Overview'}
            </CardTitle>
            {plan?.overview && projectTitle && (
              <p className="text-muted-foreground text-sm">{plan.overview}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(plan as any)?.completed_at && (
              <Badge className="bg-primary/15 text-primary border-primary/30">
                ✓ Completed
              </Badge>
            )}
            {isStrategic ? (
              <Badge className={`bg-primary/10 text-primary border-primary/20 ${isPrint ? 'print:bg-transparent print:border-foreground/30 print:text-foreground' : ''}`}>
                Strategic Plan
              </Badge>
            ) : (
              <Badge variant="outline">Standard Plan</Badge>
            )}
            {scenarioLabel && (
              <Badge variant="outline" className="text-xs">{scenarioLabel}</Badge>
            )}
            <Badge variant="outline">
              <Calendar className="w-3 h-3 mr-1" />
              {plan?.total_weeks} Weeks
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 text-primary ${isPrint ? 'print:text-foreground' : ''}`} />
            <span className="font-medium">Progress</span>
          </div>
          <span className={`text-2xl font-bold text-primary ${isPrint ? 'print:text-foreground' : ''}`}>
            {progress.percent}%
          </span>
        </div>
        <Progress value={progress.percent} className={`h-2 ${isPrint ? 'print:bg-muted' : ''}`} />
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <span>{progress.completed} of {progress.total} tasks completed</span>
          {planCreatedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {new Date(planCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
