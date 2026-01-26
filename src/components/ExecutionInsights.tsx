import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Clock, Zap, TrendingUp, Lightbulb, ChevronDown, 
  Loader2, AlertCircle, CheckCircle2, Target, Stethoscope, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  compileExecutionMetrics, 
  generateExecutionVersion,
  type ExecutionMetrics 
} from '@/lib/executionAnalytics';
import { ProFeatureIndicator } from '@/components/ProFeatureIndicator';
import { ProFeatureHint } from '@/components/ProFeatureHint';

export interface ExecutionDiagnosis {
  has_sufficient_data: boolean;
  primary_mistake: {
    label: string;
    detail: string;
  };
  secondary_pattern?: {
    label: string;
    detail: string;
  };
  adjustment: {
    action: string;
  };
}

export interface ExecutionInsightsData {
  time_estimation_insight: {
    pattern: 'optimistic' | 'accurate' | 'pessimistic';
    summary: string;
    recommendation: string;
  };
  effort_distribution_insight: {
    pattern: 'balanced' | 'struggle-heavy' | 'smooth-sailing';
    summary: string;
    observation: string;
  };
  productivity_patterns: {
    peak_performance: string;
    bottlenecks: string[];
    strengths: string[];
  };
  forward_suggestion: {
    title: string;
    detail: string;
  };
  execution_diagnosis?: ExecutionDiagnosis;
  generated_at: string;
  execution_version: string;
  tasks_analyzed: number;
  total_time_formatted: string;
}

interface ExecutionInsightsProps {
  planData: any;
  planId: string;
  cachedInsights?: ExecutionInsightsData;
  onInsightsGenerated: (insights: ExecutionInsightsData) => void;
}

const MIN_TASKS_THRESHOLD = 3;

export function ExecutionInsights({ 
  planData, 
  planId, 
  cachedInsights, 
  onInsightsGenerated 
}: ExecutionInsightsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localInsights, setLocalInsights] = useState<ExecutionInsightsData | null>(null);

  // Compute metrics and version
  const metrics = useMemo(() => compileExecutionMetrics(planData), [planData]);
  const currentVersion = useMemo(() => generateExecutionVersion(planData), [planData]);

  const completedCount = metrics.completedTasks.length;
  const hasEnoughData = completedCount >= MIN_TASKS_THRESHOLD;

  // Determine if cached insights are valid
  const isCacheValid = cachedInsights?.execution_version === currentVersion;
  const displayInsights = isCacheValid ? cachedInsights : localInsights;
  const hasInsights = !!displayInsights;
  const isStale = cachedInsights && !isCacheValid;

  const handleAnalyze = async () => {
    if (!hasEnoughData) return;

    setIsAnalyzing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke('execution-insights', {
        body: {
          metrics,
          execution_version: currentVersion,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { insights } = response.data;
      setLocalInsights(insights);
      onInsightsGenerated(insights);

      toast({
        title: "Insights generated",
        description: `Analyzed ${insights.tasks_analyzed} completed tasks.`,
      });
    } catch (error: any) {
      console.error('Execution insights error:', error);
      
      if (error?.message?.includes('429') || error?.status === 429) {
        toast({
          title: "Rate limited",
          description: "Please try again in a few moments.",
          variant: "destructive",
        });
      } else if (error?.message?.includes('402') || error?.status === 402) {
        toast({
          title: "Credits exhausted",
          description: "Add credits to your workspace to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: "Could not generate insights. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPatternBadge = (pattern: string, type: 'time' | 'effort') => {
    const configs: Record<string, { color: string; label: string }> = {
      // Time patterns
      optimistic: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Optimistic' },
      accurate: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Accurate' },
      pessimistic: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Pessimistic' },
      // Effort patterns
      balanced: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Balanced' },
      'struggle-heavy': { color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: 'Struggle-Heavy' },
      'smooth-sailing': { color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', label: 'Smooth Sailing' },
    };

    const config = configs[pattern] || { color: 'bg-muted', label: pattern };
    return (
      <Badge variant="outline" className={cn("text-xs", config.color)}>
        {config.label}
      </Badge>
    );
  };

  const EffortBar = ({ easy, okay, hard }: { easy: number; okay: number; hard: number }) => {
    const total = easy + okay + hard;
    if (total === 0) return null;

    const easyPct = (easy / total) * 100;
    const okayPct = (okay / total) * 100;
    const hardPct = (hard / total) * 100;

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-muted/30">
          {easyPct > 0 && (
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${easyPct}%` }}
              title={`Easy: ${easy}`}
            />
          )}
          {okayPct > 0 && (
            <div 
              className="h-full bg-amber-500" 
              style={{ width: `${okayPct}%` }}
              title={`Okay: ${okay}`}
            />
          )}
          {hardPct > 0 && (
            <div 
              className="h-full bg-rose-500" 
              style={{ width: `${hardPct}%` }}
              title={`Hard: ${hard}`}
            />
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {easy}/{okay}/{hard}
        </span>
      </div>
    );
  };

  return (
    <Collapsible defaultOpen={false} className="animate-slide-up">
      <Card className="glass-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Execution Insights</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Based on your completed work
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasInsights && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {displayInsights.tasks_analyzed} tasks analyzed
                  </Badge>
                )}
                {!hasInsights && hasEnoughData && (
                  <Badge variant="outline" className="bg-muted/50">
                    {completedCount} tasks ready
                  </Badge>
                )}
                {isStale && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    New data
                  </Badge>
                )}
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Not enough data state */}
            {!hasEnoughData && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Target className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">
                  Complete {MIN_TASKS_THRESHOLD - completedCount} more task{MIN_TASKS_THRESHOLD - completedCount !== 1 ? 's' : ''} with time tracking to unlock insights.
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {completedCount} of {MIN_TASKS_THRESHOLD} minimum tasks completed
                </p>
              </div>
            )}

            {/* Generate button state */}
            {hasEnoughData && !hasInsights && (
              <div className="text-center py-6">
                <div className="mb-4 p-4 rounded-lg bg-muted/30 text-left">
                  <p className="text-sm font-medium text-foreground mb-2">Ready to analyze:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {completedCount} completed tasks with time data</li>
                    <li>• {metrics.effortPatterns.totalWithFeedback} tasks with effort feedback</li>
                    <li>• Average variance: {Math.round(metrics.estimationAccuracy.averageVariance)}%</li>
                  </ul>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="gradient-kaamyab"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing patterns...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Insights display */}
            {hasInsights && displayInsights && (
              <div className="space-y-4">
                {/* Time Estimation Section */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">Time Estimation</h4>
                    </div>
                    {getPatternBadge(displayInsights.time_estimation_insight.pattern, 'time')}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    {displayInsights.time_estimation_insight.summary}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-primary">→</span>
                    <span className="text-foreground">{displayInsights.time_estimation_insight.recommendation}</span>
                  </div>
                </div>

                {/* Effort Distribution Section */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">Effort Distribution</h4>
                    </div>
                    {getPatternBadge(displayInsights.effort_distribution_insight.pattern, 'effort')}
                  </div>
                  <EffortBar 
                    easy={metrics.effortPatterns.easyCount}
                    okay={metrics.effortPatterns.okayCount}
                    hard={metrics.effortPatterns.hardCount}
                  />
                  <p className="text-muted-foreground text-sm mt-2">
                    {displayInsights.effort_distribution_insight.summary}
                  </p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {displayInsights.effort_distribution_insight.observation}
                  </p>
                </div>

                {/* Productivity Patterns Section */}
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">Productivity Patterns</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Peak Performance</span>
                      <p className="text-sm text-foreground">{displayInsights.productivity_patterns.peak_performance}</p>
                    </div>

                    {displayInsights.productivity_patterns.bottlenecks.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Bottlenecks</span>
                        <ul className="mt-1 space-y-1">
                          {displayInsights.productivity_patterns.bottlenecks.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-foreground/80">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayInsights.productivity_patterns.strengths.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Strengths</span>
                        <ul className="mt-1 space-y-1">
                          {displayInsights.productivity_patterns.strengths.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="text-foreground/80">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Forward Suggestion Section */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground">{displayInsights.forward_suggestion.title}</h4>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {displayInsights.forward_suggestion.detail}
                  </p>
                </div>

                {/* Execution Diagnosis Subsection */}
                {displayInsights.execution_diagnosis && (
                  <Collapsible defaultOpen={false} className="mt-2">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Execution Diagnosis</span>
                          <ProFeatureIndicator featureId="deeper-diagnosis" variant="star" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pt-3 space-y-3">
                        {!displayInsights.execution_diagnosis.has_sufficient_data ? (
                          <p className="text-sm text-muted-foreground italic px-1">
                            Not enough execution data yet to identify reliable patterns.
                          </p>
                        ) : (
                          <>
                            {/* Primary Mistake */}
                            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs text-rose-600 font-medium uppercase tracking-wider">Primary drag</span>
                                  <p className="text-sm text-foreground mt-1">
                                    <span className="font-medium">{displayInsights.execution_diagnosis.primary_mistake.label}:</span>{' '}
                                    {displayInsights.execution_diagnosis.primary_mistake.detail}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Secondary Pattern (optional) */}
                            {displayInsights.execution_diagnosis.secondary_pattern && (
                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                  <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-xs text-amber-600 font-medium uppercase tracking-wider">Secondary pattern</span>
                                    <p className="text-sm text-foreground mt-1">
                                      <span className="font-medium">{displayInsights.execution_diagnosis.secondary_pattern.label}:</span>{' '}
                                      {displayInsights.execution_diagnosis.secondary_pattern.detail}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Adjustment */}
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                              <div className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Next cycle adjustment</span>
                                  <p className="text-sm text-foreground mt-1 font-medium">
                                    {displayInsights.execution_diagnosis.adjustment.action}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <p className="text-xs text-muted-foreground/50 px-1">
                          This diagnosis is based on observed behavior only and does not modify your plan.
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Disclaimer + Re-analyze */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground/60">
                    Based on {displayInsights.tasks_analyzed} tasks · {displayInsights.total_time_formatted} tracked
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="text-xs h-8"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>Re-analyze</>
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
