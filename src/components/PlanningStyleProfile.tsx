/**
 * Planning Style Profile Component
 * 
 * Displays the user's planning style derived from historical behavior.
 * This is observational only - no advice, no recommendations, no pressure.
 * 
 * Core principle: Mirror, not coach.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProFeatureIndicator } from '@/components/ProFeatureIndicator';
import { usePlanningStyle } from '@/hooks/usePlanningStyle';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { DIMENSION_LABELS, MIN_PLANS_FOR_PROFILE } from '@/lib/planningStyleAnalysis';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  User2, 
  Loader2, 
  AlertCircle,
  History
} from 'lucide-react';

interface PlanningStyleProfileProps {
  userId: string;
  planData?: { is_strategic_plan?: boolean } | null;
}

/**
 * Dimension spectrum bar - shows position on a neutral spectrum
 */
function DimensionBar({ 
  leftLabel, 
  rightLabel, 
  value, 
  leftDescription,
  rightDescription,
}: { 
  leftLabel: string;
  rightLabel: string;
  value: number;
  leftDescription: string;
  rightDescription: string;
}) {
  // Position the marker (0 = left, 1 = right)
  const markerPosition = Math.max(0, Math.min(100, value * 100));
  
  return (
    <div className="space-y-1.5">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{leftLabel}</span>
          <span className="text-muted-foreground/70 text-[10px]">{leftDescription}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-medium text-foreground">{rightLabel}</span>
          <span className="text-muted-foreground/70 text-[10px]">{rightDescription}</span>
        </div>
      </div>
      
      {/* Spectrum bar */}
      <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
        {/* Gradient track - subtle, neutral colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-muted to-primary/20" />
        
        {/* Marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm transition-all duration-300"
          style={{ left: `calc(${markerPosition}% - 6px)` }}
        />
      </div>
    </div>
  );
}

/**
 * Evolution history display - simple text view
 */
function StyleEvolution({ 
  history 
}: { 
  history: { date: string; plans_at_time: number }[] | undefined;
}) {
  if (!history || history.length < 2) return null;
  
  const recentHistory = history.slice(-5).reverse();
  
  return (
    <div className="space-y-2 pt-3 border-t border-border/50">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="w-3.5 h-3.5" />
        <span>Profile updates</span>
      </div>
      <div className="space-y-1">
        {recentHistory.map((snapshot, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground/80">
            <span>
              {new Date(snapshot.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: i === 0 ? 'numeric' : undefined,
              })}
            </span>
            <span>{snapshot.plans_at_time} plans analyzed</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlanningStyleProfile({ userId, planData }: PlanningStyleProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check Pro access - hidden for free users
  const { hasAccess } = useFeatureAccess('planning-style-profile', planData);
  
  // Fetch planning style data
  const { 
    profile, 
    loading, 
    error, 
    hasEnoughData,
    summaryLoading,
  } = usePlanningStyle(userId);
  
  // Don't render at all for free users
  if (!hasAccess) {
    return null;
  }
  
  // Loading state
  if (loading) {
    return (
      <Card className="glass-card animate-slide-up">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="glass-card animate-slide-up">
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </CardContent>
      </Card>
    );
  }
  
  // Not enough data
  if (!hasEnoughData || !profile) {
    return (
      <Card className="glass-card animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <User2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Planning Style</CardTitle>
                <ProFeatureIndicator featureId="planning-style-profile" variant="badge" />
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                Your personal planning patterns
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground">
              Complete {MIN_PLANS_FOR_PROFILE}+ plans to see your planning style.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {profile?.plans_analyzed || 0} of {MIN_PLANS_FOR_PROFILE} plans completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card animate-slide-up overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Planning Style</CardTitle>
                    <ProFeatureIndicator featureId="planning-style-profile" variant="badge" />
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Based on {profile.plans_analyzed} completed plans
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-5">
            {/* Style Dimensions */}
            <div className="space-y-4">
              {DIMENSION_LABELS.map((dim) => (
                <DimensionBar
                  key={dim.dimension}
                  leftLabel={dim.leftLabel}
                  rightLabel={dim.rightLabel}
                  leftDescription={dim.leftDescription}
                  rightDescription={dim.rightDescription}
                  value={profile.dimensions[dim.dimension]}
                />
              ))}
            </div>
            
            {/* AI Summary */}
            {profile.summary ? (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {profile.summary}
                </p>
                {summaryLoading && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </div>
                )}
              </div>
            ) : summaryLoading ? (
              <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Generating summary...</span>
              </div>
            ) : null}
            
            {/* Evolution History */}
            <StyleEvolution history={profile.evolution_history} />
            
            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground/60 text-center italic">
              This reflects your historical patterns. It does not affect your plan.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
