import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface SoftFeedbackSummaryProps {
  feedback: any[];
}

const SoftFeedbackSummary = ({ feedback }: SoftFeedbackSummaryProps) => {
  if (!feedback || feedback.length === 0) return null;

  const scored = feedback.filter(f => f.strategy_score || f.feasibility_score || f.execution_score);
  
  const avg = (key: string) => {
    const vals = scored.filter(f => f[key]).map(f => f[key]);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10;
  };

  const avgStrategy = avg('strategy_score');
  const avgFeasibility = avg('feasibility_score');
  const avgExecution = avg('execution_score');

  const hasScores = avgStrategy || avgFeasibility || avgExecution;

  return (
    <Card className="border-primary/10 bg-primary/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          External Feedback ({feedback.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasScores && (
          <div className="flex gap-6 mb-2">
            {avgStrategy && (
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{avgStrategy}</p>
                <p className="text-[10px] text-muted-foreground">Strategy</p>
              </div>
            )}
            {avgFeasibility && (
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{avgFeasibility}</p>
                <p className="text-[10px] text-muted-foreground">Feasibility</p>
              </div>
            )}
            {avgExecution && (
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{avgExecution}</p>
                <p className="text-[10px] text-muted-foreground">Execution</p>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {scored.length} rated, {feedback.length - scored.length} comment-only
        </p>
      </CardContent>
    </Card>
  );
};

export default SoftFeedbackSummary;
