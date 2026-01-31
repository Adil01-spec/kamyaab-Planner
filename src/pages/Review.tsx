import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DynamicBackground } from '@/components/DynamicBackground';
import { BottomNav } from '@/components/BottomNav';
import { PlanRealityCheck } from '@/components/PlanRealityCheck';
import { ExecutionInsights, type ExecutionInsightsData } from '@/components/ExecutionInsights';
import { CalibrationInsights } from '@/components/CalibrationInsights';
import { ProgressProof } from '@/components/ProgressProof';
import { NextCycleGuidance } from '@/components/NextCycleGuidance';
import { StrategicReviewExportButton } from '@/components/StrategicReviewExportButton';
import { ShareReviewButton } from '@/components/ShareReviewButton';
import { ExternalFeedbackSection } from '@/components/ExternalFeedbackSection';
import { PlanHistorySection } from '@/components/PlanHistorySection';
import { PlanningStyleProfile } from '@/components/PlanningStyleProfile';
import { ProFeatureIndicator } from '@/components/ProFeatureIndicator';
import { calculatePlanProgress } from '@/lib/planProgress';
import { useMobileSettings } from '@/hooks/useMobileSettings';
import { useDesktopSettings } from '@/hooks/useDesktopSettings';
import { toast } from '@/hooks/use-toast';
import { type ScenarioTag } from '@/lib/scenarioMemory';
import { 
  ArrowLeft, Home, Target, ChevronDown, Lightbulb, AlertTriangle,
  Loader2, Calendar, FileText, BarChart3
} from 'lucide-react';

interface RealityCritique {
  feasibility: {
    assessment: 'realistic' | 'challenging' | 'unrealistic';
    summary: string;
    concerns: string[];
  };
  risk_signals: { items: { signal: string; severity: 'low' | 'medium' | 'high' }[] };
  focus_gaps: { items: string[]; strategic_blind_spots?: string[] };
  deprioritization_suggestions: { items: { task_or_area: string; reason: string }[] };
  is_strategic: boolean;
  generated_at: string;
  plan_version?: string;
}

interface StrategyOverview {
  objective: string;
  why_now?: string;
  success_definition?: string;
}

interface Risk {
  risk: string;
  mitigation?: string;
}

interface StrategicMilestone {
  title: string;
  week: number;
  outcome?: string;
  timeframe?: string;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  milestones: StrategicMilestone[];
  weeks: { week: number; focus: string; tasks: any[] }[];
  motivation: string[];
  is_open_ended?: boolean;
  identity_statement?: string;
  is_strategic_plan?: boolean;
  strategy_overview?: StrategyOverview;
  assumptions?: string[];
  risks?: Risk[];
  reality_check?: RealityCritique;
  execution_insights?: ExecutionInsightsData;
  plan_context?: { scenario?: ScenarioTag };
}

/**
 * Plan Review Page
 * 
 * Dedicated read-only page for all reflective, analytical, and shareable features.
 * Separates "thinking" from "doing" - /plan is execution, /review is insight.
 */
const Review = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings for dynamic background
  const { settings: mobileSettings, isMobile } = useMobileSettings();
  const { settings: desktopSettings } = useDesktopSettings();
  const dynamicBackgroundEnabled = isMobile ? mobileSettings.dynamicBackground : desktopSettings.dynamicBackground;
  const backgroundPattern = isMobile ? mobileSettings.backgroundPattern : desktopSettings.backgroundPattern;

  // Fetch plan data
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, plan_json, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.plan_json) {
          setPlanId(data.id);
          setPlan(data.plan_json as unknown as PlanData);
          setPlanCreatedAt(data.created_at);
        } else {
          // No plan found - redirect to plan creation
          navigate('/plan/reset', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        toast({
          title: 'Error loading plan',
          description: 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user, navigate]);

  // Handler for updating cached reality check critique
  const handleCritiqueGenerated = useCallback(async (critique: RealityCritique) => {
    if (!planId || !user || !plan) return;
    
    const updatedPlan = { ...plan, reality_check: critique };
    setPlan(updatedPlan);
    
    try {
      await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error caching critique:', error);
    }
  }, [plan, planId, user]);

  // Handler for updating cached execution insights
  const handleInsightsGenerated = useCallback(async (insights: ExecutionInsightsData) => {
    if (!planId || !user || !plan) return;
    
    const updatedPlan = { ...plan, execution_insights: insights };
    setPlan(updatedPlan);
    
    try {
      await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error caching insights:', error);
    }
  }, [plan, planId, user]);

  const progress = calculatePlanProgress(plan);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Loading review...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <FileText className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No plan found</p>
        <Button onClick={() => navigate('/plan/reset')}>Create a Plan</Button>
      </div>
    );
  }

  const scenarioLabel = plan.plan_context?.scenario;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Dynamic Background */}
      <DynamicBackground 
        enabled={dynamicBackgroundEnabled} 
        pattern={backgroundPattern}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/plan')}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Plan Review
                </h1>
                <p className="text-xs text-muted-foreground">Strategy, insights, and progress</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="text-muted-foreground"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* 1. Plan Overview - Always open */}
        <Card className="glass-card animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">{profile?.projectTitle || 'Your Plan'}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.overview}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {plan.is_strategic_plan ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">Strategic Plan</Badge>
                ) : (
                  <Badge variant="outline">Standard Plan</Badge>
                )}
                {scenarioLabel && (
                  <Badge variant="outline" className="text-xs">{scenarioLabel}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <Progress value={progress.percent} className="h-2" />
              </div>
              <span className="text-lg font-bold text-primary">{progress.percent}%</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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

        {/* 2. Strategy Section - Strategic Plans Only */}
        {plan.is_strategic_plan && plan.strategy_overview && (
          <Collapsible defaultOpen={false}>
            <Card className="glass-card animate-slide-up overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">Strategy Overview</CardTitle>
                          <ProFeatureIndicator featureId="strategy-overview" variant="badge" />
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Strategic context and risks
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Objective */}
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">Objective</h4>
                    </div>
                    <p className="text-muted-foreground">{plan.strategy_overview.objective}</p>
                  </div>

                  {/* Why Now */}
                  {plan.strategy_overview.why_now && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium text-foreground mb-2">Why Now</h4>
                      <p className="text-muted-foreground">{plan.strategy_overview.why_now}</p>
                    </div>
                  )}

                  {/* Success Definition */}
                  {plan.strategy_overview.success_definition && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium text-foreground mb-2">Success Definition</h4>
                      <p className="text-muted-foreground">{plan.strategy_overview.success_definition}</p>
                    </div>
                  )}

                  {/* Assumptions */}
                  {plan.assumptions && plan.assumptions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Key Assumptions</h4>
                      <ul className="space-y-1">
                        {plan.assumptions.map((assumption, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risks */}
                  {plan.risks && plan.risks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Risks & Mitigations
                      </h4>
                      <div className="space-y-2">
                        {plan.risks.map((riskItem, i) => (
                          <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                            <p className="text-foreground font-medium">{riskItem.risk}</p>
                            {riskItem.mitigation && (
                              <p className="text-muted-foreground text-sm mt-1">
                                <span className="text-primary">Mitigation:</span> {riskItem.mitigation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategic Milestones */}
                  {plan.milestones && plan.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Strategic Milestones</h4>
                      <div className="space-y-2">
                        {plan.milestones.map((milestone, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <span className="text-foreground">{milestone.title}</span>
                            <div className="flex items-center gap-2">
                              {milestone.timeframe && (
                                <span className="text-xs text-muted-foreground">{milestone.timeframe}</span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                Week {milestone.week}
                              </Badge>
                            </div>
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

        {/* 3. Plan Reality Check */}
        {planId && (
          <PlanRealityCheck
            plan={plan}
            planId={planId}
            cachedCritique={plan.reality_check}
            onCritiqueGenerated={handleCritiqueGenerated}
          />
        )}

        {/* 4. Execution Insights */}
        {planId && (
          <ExecutionInsights
            planData={plan}
            planId={planId}
            cachedInsights={plan.execution_insights}
            onInsightsGenerated={handleInsightsGenerated}
          />
        )}

        {/* 5. Progress Proof */}
        {user && profile && (
          <ProgressProof
            userId={user.id}
            currentPlanData={plan}
            userName={profile.fullName || undefined}
            projectTitle={profile.projectTitle || undefined}
          />
        )}

        {/* 6. Calibration Insights */}
        {user && (
          <CalibrationInsights
            userId={user.id}
            currentPlanData={plan}
          />
        )}

        {/* 7. Planning Style Profile (Pro only) */}
        {user && (
          <PlanningStyleProfile
            userId={user.id}
            planData={plan}
          />
        )}

        {/* 8. Next-Cycle Guidance - After plan completion */}
        {user && progress.percent === 100 && (
          <NextCycleGuidance
            userId={user.id}
            showAfterCompletion={true}
          />
        )}

        {/* 8. External Feedback */}
        {planId && (
          <ExternalFeedbackSection planId={planId} />
        )}

        {/* 9. Plan History & Comparison */}
        {user && planId && (
          <PlanHistorySection
            userId={user.id}
            currentPlanId={planId}
            currentPlan={plan}
            currentPlanCreatedAt={planCreatedAt || undefined}
            planData={plan}
          />
        )}

        {/* 9. Export/Share Actions */}
        <Card className="glass-card animate-slide-up">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <StrategicReviewExportButton
                planData={plan}
                planCreatedAt={planCreatedAt || ''}
                projectTitle={profile?.projectTitle || 'Untitled Project'}
                projectDescription={profile?.projectDescription || undefined}
                userName={profile?.fullName || undefined}
              />
              {planId && (
                <ShareReviewButton
                  planId={planId}
                  planData={plan}
                />
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Export and share are Pro features
            </p>
          </CardContent>
        </Card>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Review;
