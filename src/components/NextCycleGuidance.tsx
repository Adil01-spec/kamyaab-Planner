import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Target, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  fetchExecutionProfile, 
  type PersonalExecutionProfile 
} from '@/lib/personalExecutionProfile';
import {
  generateNextCycleAdjustments,
  type NextCycleAdjustment,
  type NextCycleGuidanceResult,
} from '@/lib/nextCycleGuidance';

interface NextCycleGuidanceProps {
  userId: string;
  showAfterCompletion?: boolean;  // true on /plan after completion
  showBeforeGeneration?: boolean; // true on /plan/reset
}

export function NextCycleGuidance({ 
  userId, 
  showAfterCompletion = false,
  showBeforeGeneration = false 
}: NextCycleGuidanceProps) {
  const [profile, setProfile] = useState<PersonalExecutionProfile | null>(null);
  const [guidance, setGuidance] = useState<NextCycleGuidanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadGuidance = async () => {
      setLoading(true);
      try {
        const fetchedProfile = await fetchExecutionProfile(userId);
        setProfile(fetchedProfile);
        
        if (fetchedProfile?.progress_history) {
          const result = generateNextCycleAdjustments(
            fetchedProfile.progress_history,
            fetchedProfile
          );
          setGuidance(result);
        }
      } catch (error) {
        console.error('Error loading next-cycle guidance:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGuidance();
  }, [userId]);

  const history = profile?.progress_history;
  const hasCompletedPlans = history && history.snapshots.length > 0;
  const adjustmentCount = guidance?.adjustments.length || 0;

  // Don't show if still loading or no history
  if (loading) return null;
  
  // Don't show if user has never completed a plan
  if (!hasCompletedPlans) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="animate-slide-up">
      <Card className="glass-card overflow-hidden border-accent/20">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">For Your Next Plan</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {adjustmentCount > 0 
                      ? 'Data-backed suggestions from your history'
                      : 'Complete more plans to see suggestions'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {adjustmentCount > 0 && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    {adjustmentCount} suggestion{adjustmentCount === 1 ? '' : 's'}
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
            {!guidance?.available ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Complete more plan cycles to see personalized suggestions.
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Suggestions appear after your second completed plan.
                </p>
              </div>
            ) : (
              <>
                {/* Adjustment Cards */}
                <div className="space-y-3">
                  {guidance.adjustments.map((adjustment) => (
                    <AdjustmentCard key={adjustment.id} adjustment={adjustment} />
                  ))}
                </div>
                
                {/* Source indicator */}
                <p className="text-xs text-muted-foreground/60 text-center pt-2">
                  Based on {guidance.generated_from}
                </p>
                
                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground/50 text-center border-t border-border/50 pt-3">
                  These are optional suggestions based on your history.
                </p>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================
// Adjustment Card Component
// ============================================

interface AdjustmentCardProps {
  adjustment: NextCycleAdjustment;
}

function AdjustmentCard({ adjustment }: AdjustmentCardProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
      {/* Title with confidence indicator */}
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {adjustment.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {adjustment.detail}
          </p>
        </div>
        {adjustment.confidence === 'high' && (
          <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20">
            Strong pattern
          </Badge>
        )}
      </div>
      
      {/* Justification */}
      <p className="text-xs text-muted-foreground/70 pl-6 italic">
        {adjustment.justification}
      </p>
    </div>
  );
}
