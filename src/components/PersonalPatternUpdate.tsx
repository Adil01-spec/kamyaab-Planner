import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  detectPatternChanges,
  type PersonalExecutionProfile,
  type PatternChange 
} from '@/lib/personalExecutionProfile';

interface PersonalPatternUpdateProps {
  open: boolean;
  onClose: () => void;
  previousProfile: PersonalExecutionProfile | null;
  currentProfile: PersonalExecutionProfile;
  planSummary: {
    tasksCompleted: number;
    totalTimeSpent: number;
    averageVariance: number;
  };
}

const directionIcons = {
  improved: TrendingUp,
  declined: TrendingDown,
  stable: Minus,
};

const directionColors = {
  improved: 'text-emerald-600',
  declined: 'text-amber-600',
  stable: 'text-muted-foreground',
};

export function PersonalPatternUpdate({ 
  open, 
  onClose, 
  previousProfile, 
  currentProfile,
  planSummary 
}: PersonalPatternUpdateProps) {
  // Detect pattern changes
  const changes = previousProfile 
    ? detectPatternChanges(previousProfile, currentProfile)
    : [];

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Personal Pattern Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Summary */}
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-3">
              📊 Based on this plan cycle:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {planSummary.tasksCompleted} tasks completed
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {formatTime(planSummary.totalTimeSpent)} total active time
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Average variance: {planSummary.averageVariance > 0 ? '+' : ''}{Math.round(planSummary.averageVariance)}%
              </li>
            </ul>
          </div>

          {/* Pattern Changes */}
          {changes.length > 0 && (
            <div className="space-y-2">
              {changes.map((change) => {
                const Icon = directionIcons[change.direction];
                return (
                  <div 
                    key={change.field}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", directionColors[change.direction])} />
                      <span className="text-sm text-foreground">{change.label}</span>
                    </div>
                    <span className={cn("text-sm", directionColors[change.direction])}>
                      {change.detail}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* New Observations (if no previous profile) */}
          {!previousProfile && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground">
                ✨ Your personal execution profile has been created.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Future plans will include personalized calibration insights.
              </p>
            </div>
          )}

          {/* Profile Stats */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Badge variant="outline" className="bg-muted/50">
              {currentProfile.data_points_count} data points
            </Badge>
            <Badge variant="outline" className="bg-muted/50">
              {currentProfile.plans_analyzed} plans analyzed
            </Badge>
          </div>

          {/* Disclaimer */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              This reflection is observational only. Your next plan will not be auto-adjusted.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="gradient-kaamyab">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
