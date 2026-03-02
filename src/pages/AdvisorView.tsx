import { useParams } from 'react-router-dom';
import { useSharedReview } from '@/hooks/useSharedReview';
import { AdvisorFeedbackForm } from '@/components/AdvisorFeedbackForm';
import { Footer } from '@/components/Footer';
import { PlanOverviewCard } from '@/components/review/PlanOverviewCard';
import { StrategyInsightsCard } from '@/components/review/StrategyInsightsCard';
import { ExecutionMetricsCard } from '@/components/review/ExecutionMetricsCard';
import { WeeklyBreakdownCard } from '@/components/review/WeeklyBreakdownCard';
import { RealityCheckCard } from '@/components/review/RealityCheckCard';
import { isShareExpired, formatExpiryDate, getDaysUntilExpiry } from '@/lib/shareReview';
import { Loader2, FileX, AlertTriangle, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Advisor View Page
 * Professional, read-only view for mentors/advisors.
 */
export default function AdvisorView() {
  const { shareId } = useParams<{ shareId: string }>();
  const { data, loading, error } = useSharedReview(shareId);

  // Add noindex meta tag
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
    return () => { document.head.removeChild(metaRobots); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center print:bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <FileX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Review Not Found</h1>
            <p className="text-muted-foreground mb-6">This review link doesn't exist or has been removed.</p>
            <Link to="/"><Button variant="outline"><Briefcase className="w-4 h-4 mr-2" />Visit Kaamyab</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.revoked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Access Revoked</h1>
            <p className="text-muted-foreground mb-6">The plan owner has revoked access to this review.</p>
            <Link to="/"><Button variant="outline"><Briefcase className="w-4 h-4 mr-2" />Visit Kaamyab</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isShareExpired(data.expires_at)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Link Expired</h1>
            <p className="text-muted-foreground mb-6">This review link expired on {formatExpiryDate(data.expires_at)}.</p>
            <Link to="/"><Button variant="outline"><Briefcase className="w-4 h-4 mr-2" />Visit Kaamyab</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planSnapshot = data.plan_snapshot;
  const daysRemaining = getDaysUntilExpiry(data.expires_at);

  // Planning style dimension renderer
  const StyleDimension = ({ left, right, value }: { left: string; right: string; value: number }) => {
    const position = Math.max(0, Math.min(1, value || 0.5)) * 100;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-24 text-right text-muted-foreground">{left}</span>
        <div className="flex-1 h-2 bg-muted rounded-full relative">
          <div className="absolute w-3 h-3 rounded-full bg-primary print:bg-foreground -top-0.5 transition-all" style={{ left: `calc(${position}% - 6px)` }} />
        </div>
        <span className="w-24 text-muted-foreground">{right}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background print:bg-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 print:static print:border-b-2 print:border-foreground/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center print:bg-foreground/10">
              <Briefcase className="w-5 h-5 text-primary print:text-foreground" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Plan Review</span>
              <p className="text-xs text-muted-foreground">Advisor View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground print:hidden">
              <Clock className="w-3 h-3 inline mr-1" />
              {daysRemaining} days remaining
            </span>
            <Badge variant="outline" className="text-xs print:hidden">Read-Only</Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 print:py-4 w-full space-y-8 print:space-y-6">
        <PlanOverviewCard plan={planSnapshot} mode="public_snapshot" />
        <StrategyInsightsCard plan={planSnapshot} mode="public_snapshot" defaultOpen />
        <RealityCheckCard plan={planSnapshot} mode="public_snapshot" />
        <ExecutionMetricsCard plan={planSnapshot} mode="public_snapshot" />

        {/* Planning Style (advisor-specific, kept inline since it's unique to this view) */}
        {planSnapshot?.planning_style_profile && (
          <Card className="print:shadow-none print:border-foreground/20">
            <CardContent className="py-6 space-y-4">
              <h3 className="font-semibold">Planning Style</h3>
              {planSnapshot.planning_style_profile.summary && (
                <p className="text-muted-foreground italic">"{planSnapshot.planning_style_profile.summary}"</p>
              )}
              {planSnapshot.planning_style_profile.dimensions && (
                <div className="space-y-3 pt-2">
                  <StyleDimension left="Planner" right="Improviser" value={planSnapshot.planning_style_profile.dimensions.planAdherence} />
                  <StyleDimension left="Optimistic" right="Conservative" value={planSnapshot.planning_style_profile.dimensions.estimationBias} />
                  <StyleDimension left="Linear" right="Iterative" value={planSnapshot.planning_style_profile.dimensions.executionPattern} />
                  <StyleDimension left="Strategic" right="Tactical" value={planSnapshot.planning_style_profile.dimensions.planningScope} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <WeeklyBreakdownCard plan={planSnapshot} mode="public_snapshot" />

        <Separator className="print:hidden" />
        <p className="text-xs text-muted-foreground text-center print:text-left print:mt-8">
          This is a read-only view shared for advisory purposes.
          No personal identifiers are exposed. Link expires {formatExpiryDate(data.expires_at)}.
        </p>

        <AdvisorFeedbackForm sharedReviewId={data.id} />
      </main>

      <Footer className="print:hidden" />
    </div>
  );
}
