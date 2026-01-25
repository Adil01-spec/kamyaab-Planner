import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, ChevronDown, Sparkles, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  fetchExecutionProfile, 
  saveExecutionProfile,
  extractProfileFromPlan,
  mergeProfileUpdates,
  generateCalibrationInsights,
  type PersonalExecutionProfile,
  type CalibrationInsight 
} from '@/lib/personalExecutionProfile';

interface CalibrationInsightsProps {
  userId: string;
  currentPlanData: any;
}

const categoryIcons: Record<string, typeof Clock> = {
  estimation: Clock,
  workload: BarChart3,
  planning: TrendingUp,
  productivity: Sparkles,
};

const severityColors: Record<string, string> = {
  info: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  observation: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  pattern: 'bg-primary/10 text-primary border-primary/20',
};

export function CalibrationInsights({ userId, currentPlanData }: CalibrationInsightsProps) {
  const [profile, setProfile] = useState<PersonalExecutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<CalibrationInsight[]>([]);

  // Load profile and update with current plan data
  useEffect(() => {
    const loadAndUpdateProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch existing profile
        const existingProfile = await fetchExecutionProfile(userId);
        
        // Extract observations from current plan
        const newObservations = extractProfileFromPlan(currentPlanData);
        
        // Merge if there are new observations
        if (newObservations.data_points_count && newObservations.data_points_count > 0) {
          const mergedProfile = mergeProfileUpdates(existingProfile, newObservations);
          setProfile(mergedProfile);
          
          // Save updated profile (non-blocking)
          saveExecutionProfile(userId, mergedProfile).catch(console.error);
          
          // Generate insights
          const generatedInsights = generateCalibrationInsights(mergedProfile);
          setInsights(generatedInsights);
        } else if (existingProfile) {
          setProfile(existingProfile);
          const generatedInsights = generateCalibrationInsights(existingProfile);
          setInsights(generatedInsights);
        }
      } catch (error) {
        console.error('Error loading calibration profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAndUpdateProfile();
  }, [userId, currentPlanData]);

  // Don't render if no profile or insufficient data
  const hasData = profile && profile.data_points_count >= 3;
  const confidenceBadge = useMemo(() => {
    if (!profile) return null;
    const labels: Record<string, { label: string; color: string }> = {
      low: { label: 'Building profile...', color: 'bg-muted text-muted-foreground' },
      medium: { label: `${profile.data_points_count} data points`, color: 'bg-sky-500/10 text-sky-600' },
      high: { label: `${profile.data_points_count} data points`, color: 'bg-emerald-500/10 text-emerald-600' },
    };
    return labels[profile.confidence_level];
  }, [profile]);

  if (loading) {
    return null; // Don't show loading state - seamless
  }

  return (
    <Collapsible defaultOpen={false} className="animate-slide-up">
      <Card className="glass-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Based on Your History</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Personalized calibration insights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confidenceBadge && (
                  <Badge variant="outline" className={cn("text-xs", confidenceBadge.color)}>
                    {confidenceBadge.label}
                  </Badge>
                )}
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {!hasData ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">
                  Complete more plans to see personalized insights.
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {profile?.data_points_count || 0} of 3 minimum tasks analyzed
                </p>
              </div>
            ) : (
              <>
                {/* Insight Cards */}
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => {
                      const Icon = categoryIcons[insight.category] || Sparkles;
                      return (
                        <div 
                          key={insight.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            severityColors[insight.severity]
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-foreground">
                              {insight.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      Your execution patterns are balanced. No specific calibrations needed.
                    </p>
                  </div>
                )}

                {/* Profile Summary (minimal) */}
                {profile && profile.confidence_level !== 'low' && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>
                        Pattern: {profile.estimation_accuracy_trend.current_pattern}
                      </span>
                      <span>•</span>
                      <span>
                        Optimal load: {profile.overload_tendency.optimal_daily_tasks} tasks/day
                      </span>
                      <span>•</span>
                      <span>
                        Plans analyzed: {profile.plans_analyzed}
                      </span>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  These insights are based on your historical patterns and do not modify your plan.
                </p>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
