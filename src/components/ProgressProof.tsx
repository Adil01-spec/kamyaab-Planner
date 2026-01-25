import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, TrendingDown, Minus, ChevronDown, BarChart3, GitCompare, Lightbulb, ArrowLeftRight, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  fetchExecutionProfile, 
  type PersonalExecutionProfile,
  type ProgressHistory 
} from '@/lib/personalExecutionProfile';
import {
  detectProgressTrends,
  compareToPreviousPlan,
  attributeImprovements,
  compareStrategicVsStandard,
  hasEnoughProgressData,
  type ProgressTrend,
  type PlanComparison,
  type ProgressAttribution,
  type StrategicComparison,
  type TrendDirection,
} from '@/lib/progressProof';
import { generateProgressPdf } from '@/lib/progressPdfExport';

interface ProgressProofProps {
  userId: string;
  currentPlanData: any;
  userName?: string;
  projectTitle?: string;
}

export function ProgressProof({ userId, currentPlanData, userName, projectTitle }: ProgressProofProps) {
  const [profile, setProfile] = useState<PersonalExecutionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Derived insights
  const [trends, setTrends] = useState<ProgressTrend[]>([]);
  const [comparison, setComparison] = useState<PlanComparison | null>(null);
  const [attributions, setAttributions] = useState<ProgressAttribution[]>([]);
  const [strategicComparison, setStrategicComparison] = useState<StrategicComparison | null>(null);
  
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const fetchedProfile = await fetchExecutionProfile(userId);
        setProfile(fetchedProfile);
        
        if (fetchedProfile?.progress_history) {
          const history = fetchedProfile.progress_history;
          
          // Calculate all insights
          setTrends(detectProgressTrends(history, 3));
          setComparison(compareToPreviousPlan(history));
          setStrategicComparison(compareStrategicVsStandard(history));
          
          // Calculate attributions if we have improvement
          if (history.snapshots.length >= 2) {
            const current = history.snapshots[history.snapshots.length - 1];
            const previous = history.snapshots[history.snapshots.length - 2];
            setAttributions(attributeImprovements(current, previous));
          }
        }
      } catch (error) {
        console.error('Error loading profile for progress proof:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);
  
  const history = profile?.progress_history;
  const hasEnoughData = hasEnoughProgressData(history);
  const plansTracked = history?.total_plans_tracked || 0;
  
  // Show improvements only if there are any
  const hasImprovements = attributions.length > 0;
  
  // Get trend icon
  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getTrendBadge = (direction: TrendDirection) => {
    switch (direction) {
      case 'improving':
        return (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
            Improving
          </Badge>
        );
      case 'declining':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            Declining
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Stable
          </Badge>
        );
    }
  };
  
  const handleExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent collapsible toggle
    
    if (!history) return;
    
    setExporting(true);
    try {
      await generateProgressPdf(history, { userName, projectTitle });
      toast({
        title: 'Report downloaded',
        description: 'Your progress report has been saved as a PDF.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export failed',
        description: 'Could not generate the PDF report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };
  
  if (loading) {
    return null; // Don't show anything while loading
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="animate-slide-up">
      <Card className="glass-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Your Progress Over Time</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {hasEnoughData 
                      ? 'Evidence of your planning improvement'
                      : 'Complete more plan cycles to see progress'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasEnoughData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={exporting}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="ml-1.5 hidden sm:inline text-xs">Export</span>
                  </Button>
                )}
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-xs">
                  {plansTracked} {plansTracked === 1 ? 'plan' : 'plans'} tracked
                </Badge>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {!hasEnoughData ? (
              <div className="text-center py-6 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Complete more plan cycles to see progress trends.
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Progress tracking begins after your second completed plan.
                </p>
              </div>
            ) : (
              <>
                {/* Progress Trends Section */}
                {trends.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Progress Trends
                    </h4>
                    <div className="space-y-2">
                      {trends.map((trend) => (
                        <div 
                          key={trend.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="mt-0.5">
                            {getTrendIcon(trend.trend.direction)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">
                                {trend.label}
                              </span>
                              {getTrendBadge(trend.trend.direction)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {trend.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Compared to Previous Plan Section */}
                {comparison?.available && comparison.insights.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-primary" />
                      Compared to Your Previous Plan
                    </h4>
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <ul className="space-y-2">
                        {comparison.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="text-muted-foreground">{insight.detail}</span>
                          </li>
                        ))}
                      </ul>
                      {comparison.summary && (
                        <p className="text-xs text-muted-foreground/70 mt-3 pt-3 border-t border-accent/20">
                          {comparison.summary}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Why This Improved Section */}
                {hasImprovements && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Why This Improved
                    </h4>
                    <div className="space-y-2">
                      {attributions.map((attr, index) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                        >
                          <p className="text-sm text-foreground font-medium">
                            {attr.attributed_to}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on your execution data
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Strategic vs Standard Section */}
                {strategicComparison?.available && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-primary" />
                      Strategic vs Standard
                    </h4>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      {strategicComparison.strategic_insight && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {strategicComparison.strategic_insight}
                        </p>
                      )}
                      {strategicComparison.standard_insight && (
                        <p className="text-sm text-muted-foreground">
                          {strategicComparison.standard_insight}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  These observations are based on your historical data.
                </p>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
