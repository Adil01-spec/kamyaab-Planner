import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MessageSquare, ChevronDown, Users, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { useAllPlanFeedback, AggregatedFeedback } from '@/hooks/useReviewFeedback';
import { cn } from '@/lib/utils';

interface ExternalFeedbackSectionProps {
  planId: string;
}

const CHALLENGE_LABELS: Record<string, string> = {
  timeline: 'Timeline',
  scope: 'Scope',
  resources: 'Resources',
  priorities: 'Priorities',
};

/**
 * Collapsible section on /plan page showing aggregated external feedback
 */
export function ExternalFeedbackSection({ planId }: ExternalFeedbackSectionProps) {
  const { feedback, loading, error } = useAllPlanFeedback(planId);
  const [showNotes, setShowNotes] = useState(false);

  // Don't show if no feedback
  if (!feedback || feedback.totalResponses === 0) {
    return null;
  }

  const totalRealism =
    feedback.realism.yes + feedback.realism.somewhat + feedback.realism.no;
  const positivePercent = totalRealism > 0
    ? Math.round((feedback.realism.yes / totalRealism) * 100)
    : 0;
  const concernPercent = totalRealism > 0
    ? Math.round((feedback.realism.no / totalRealism) * 100)
    : 0;

  // Sort challenge areas by count
  const sortedChallenges = Object.entries(feedback.challengeAreas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <Collapsible>
      <Card className="glass-card animate-slide-up">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">External Feedback</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Insights from shared reviews
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5">
                  <Users className="w-3 h-3 mr-1" />
                  {feedback.totalResponses} response{feedback.totalResponses !== 1 ? 's' : ''}
                </Badge>
                <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Realism Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-primary">{feedback.realism.yes}</p>
                <p className="text-xs text-muted-foreground">Realistic</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{feedback.realism.somewhat}</p>
                <p className="text-xs text-muted-foreground">Somewhat</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ThumbsDown className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-destructive">{feedback.realism.no}</p>
                <p className="text-xs text-muted-foreground">Not Realistic</p>
              </div>
            </div>

            {/* Challenge Areas */}
            {sortedChallenges.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Most Challenged Areas</p>
                <div className="flex flex-wrap gap-2">
                  {sortedChallenges.map(([area, count]) => (
                    <Badge
                      key={area}
                      variant="outline"
                      className={cn(
                        'px-3 py-1',
                        count >= 2 && 'border-destructive/50 text-destructive'
                      )}
                    >
                      {CHALLENGE_LABELS[area] || area}
                      <span className="ml-1.5 text-xs opacity-70">×{count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Unclear/Risky Notes */}
            {feedback.unclearNotes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Comments ({feedback.unclearNotes.length})
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-xs h-7"
                  >
                    {showNotes ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showNotes && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {feedback.unclearNotes.map((note, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-muted/50 text-sm text-muted-foreground"
                      >
                        "{note}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary insight */}
            {concernPercent >= 50 && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {concernPercent}% of reviewers expressed concerns about realism.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
