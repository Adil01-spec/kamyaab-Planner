import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  ChevronDown, 
  AlertTriangle, 
  Target, 
  Archive, 
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeasibilityData {
  assessment: 'realistic' | 'challenging' | 'unrealistic';
  summary: string;
  concerns: string[];
}

interface RiskSignal {
  signal: string;
  severity: 'low' | 'medium' | 'high';
}

interface DeprioritizationItem {
  task_or_area: string;
  reason: string;
}

interface RealityCritique {
  feasibility: FeasibilityData;
  risk_signals: { items: RiskSignal[] };
  focus_gaps: { items: string[]; strategic_blind_spots?: string[] };
  deprioritization_suggestions: { items: DeprioritizationItem[] };
  is_strategic: boolean;
  generated_at: string;
  plan_version?: string;
}

interface PlanRealityCheckProps {
  plan: any;
  planId: string;
  cachedCritique?: RealityCritique;
  onCritiqueGenerated: (critique: RealityCritique) => void;
}

// Generate a simple hash of plan tasks to detect changes
function generatePlanVersion(plan: any): string {
  const taskSignature = plan.weeks
    .map((w: any) => w.tasks.map((t: any) => t.title).join('|'))
    .join('||');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < taskSignature.length; i++) {
    const char = taskSignature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function PlanRealityCheck({ plan, planId, cachedCritique, onCritiqueGenerated }: PlanRealityCheckProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [critique, setCritique] = useState<RealityCritique | null>(cachedCritique || null);
  const [isOpen, setIsOpen] = useState(false);

  // Check if cached critique is still valid
  const currentVersion = generatePlanVersion(plan);
  const isCacheValid = critique?.plan_version === currentVersion;

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please log in to analyze your plan.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('plan-reality-check', {
        body: { plan },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data.critique as RealityCritique;
      result.plan_version = currentVersion;
      
      setCritique(result);
      onCritiqueGenerated(result);
      
      toast({
        title: "Analysis complete",
        description: "Your plan reality check is ready.",
      });
    } catch (error: any) {
      console.error('Plan reality check error:', error);
      
      let errorMessage = "Could not analyze your plan. Please try again.";
      if (error?.message?.includes('429') || error?.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (error?.message?.includes('402') || error?.status === 402) {
        errorMessage = "AI credits exhausted. Please add credits to continue.";
      }
      
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [plan, currentVersion, onCritiqueGenerated]);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  const getAssessmentColor = (assessment: 'realistic' | 'challenging' | 'unrealistic') => {
    switch (assessment) {
      case 'realistic': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'challenging': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'unrealistic': return 'bg-destructive/10 text-destructive border-destructive/30';
    }
  };

  const isStrategic = plan.is_strategic_plan === true;
  const showCritique = critique && isCacheValid;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="animate-slide-up">
      <Card className="glass-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Plan Reality Check</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    AI-powered critique of your plan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isStrategic && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Full Analysis
                  </Badge>
                )}
                {showCritique && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                    Analyzed
                  </Badge>
                )}
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>This analysis does not modify your plan. It provides insights only.</span>
            </div>

            {!showCritique ? (
              /* No critique yet - show analyze button */
              <div className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Get an honest assessment of your plan's feasibility, risks, and blind spots.
                </p>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isLoading}
                  className="gradient-kaamyab"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing your plan...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze My Plan
                    </>
                  )}
                </Button>
                {critique && !isCacheValid && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your plan has changed. Click to generate a new analysis.
                  </p>
                )}
              </div>
            ) : (
              /* Show the critique */
              <div className="space-y-4">
                {/* Feasibility Check */}
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">Feasibility Check</h4>
                    </div>
                    <Badge className={cn("capitalize", getAssessmentColor(critique.feasibility.assessment))}>
                      {critique.feasibility.assessment}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{critique.feasibility.summary}</p>
                  {critique.feasibility.concerns.length > 0 && (
                    <ul className="space-y-1">
                      {critique.feasibility.concerns.map((concern, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-destructive mt-0.5">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Risk Signals */}
                {critique.risk_signals.items.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <h4 className="font-medium text-foreground">Risk Signals</h4>
                    </div>
                    <div className="space-y-2">
                      {critique.risk_signals.items.map((risk, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                          <Badge 
                            variant="outline" 
                            className={cn("capitalize text-xs shrink-0", getSeverityColor(risk.severity))}
                          >
                            {risk.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{risk.signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Focus Gaps */}
                {(critique.focus_gaps.items.length > 0 || 
                  (critique.focus_gaps.strategic_blind_spots && critique.focus_gaps.strategic_blind_spots.length > 0)) && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">Focus Gaps</h4>
                    </div>
                    {critique.focus_gaps.items.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {critique.focus_gaps.items.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {critique.focus_gaps.strategic_blind_spots && critique.focus_gaps.strategic_blind_spots.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Strategic Blind Spots
                        </p>
                        <ul className="space-y-1">
                          {critique.focus_gaps.strategic_blind_spots.map((spot, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-yellow-500 mt-0.5">⚠</span>
                              <span>{spot}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* De-prioritization Suggestions */}
                {critique.deprioritization_suggestions.items.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Archive className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium text-foreground">Could Be De-prioritized</h4>
                    </div>
                    <div className="space-y-2">
                      {critique.deprioritization_suggestions.items.map((item, i) => (
                        <div key={i} className="p-2 rounded-lg bg-background/50">
                          <p className="text-sm font-medium text-foreground">{item.task_or_area}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Re-analyze button */}
                <div className="pt-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-3 h-3 mr-2" />
                        Re-analyze Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
