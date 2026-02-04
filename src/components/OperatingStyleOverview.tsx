/**
 * Operating Style Overview Component
 * 
 * Phase 10.1: Displays the "Working Pattern Overview" section on /review.
 * Pro-only feature with no locked preview for Standard/Student.
 * 
 * Features:
 * - Collapsible section (collapsed by default)
 * - Four neutral spectrum bars
 * - AI-generated summary
 * - Observational disclaimer
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ChevronDown, Loader2 } from 'lucide-react';
import { useOperatingStyle } from '@/hooks/useOperatingStyle';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { DIMENSION_METADATA, MIN_PLANS_FOR_PROFILE } from '@/lib/personalOperatingStyle';
import { cn } from '@/lib/utils';

interface OperatingStyleOverviewProps {
  userId: string;
  planData?: { is_strategic_plan?: boolean } | null;
}

/**
 * Dimension spectrum bar component
 */
function DimensionBar({
  leftLabel,
  rightLabel,
  value,
  description,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  description: string;
}) {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));
  const percentage = clampedValue * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{leftLabel}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        {/* Position marker */}
        <div
          className="absolute top-0 h-full w-1 bg-primary rounded-full shadow-sm"
          style={{ left: `calc(${percentage}% - 2px)` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/80">{description}</p>
    </div>
  );
}

export function OperatingStyleOverview({ userId, planData }: OperatingStyleOverviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hasAccess } = useFeatureAccess('operating-style-overview', planData);
  const { profile, isLoading, error, hasEnoughData, planCount } = useOperatingStyle(userId);

  // Pro-only: Don't render anything for non-Pro users (no preview, no locked UI)
  if (!hasAccess) {
    return null;
  }

  // Not enough data yet
  if (!isLoading && !hasEnoughData) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card animate-slide-up overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Working Pattern Overview</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {isLoading ? (
                      'Loading...'
                    ) : profile ? (
                      `Based on ${profile.analyzedPlansCount} completed plans`
                    ) : (
                      `Requires ${MIN_PLANS_FOR_PROFILE} completed plans`
                    )}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Analyzing your patterns...</span>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : profile ? (
              <>
                {/* Four Dimension Bars */}
                <div className="space-y-5">
                  {DIMENSION_METADATA.map((dim) => (
                    <DimensionBar
                      key={dim.id}
                      leftLabel={dim.leftLabel}
                      rightLabel={dim.rightLabel}
                      value={profile.dimensions[dim.id]}
                      description={dim.description}
                    />
                  ))}
                </div>

                {/* AI Summary */}
                {profile.aiSummary && (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      {profile.aiSummary}
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground/70 text-center">
                  This reflects your historical patterns. It is observational only.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Complete at least {MIN_PLANS_FOR_PROFILE} plans to see your working patterns.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
