import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanCycleSnapshot } from '@/lib/personalExecutionProfile';
import { format } from 'date-fns';

interface ProgressTimelineProps {
  snapshots: PlanCycleSnapshot[];
}

export function ProgressTimeline({ snapshots }: ProgressTimelineProps) {
  if (snapshots.length < 2) return null;

  // Format time spent
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get smoothness color based on value
  const getSmoothnessColor = (smoothness: number): string => {
    if (smoothness >= 80) return 'text-primary';
    if (smoothness >= 60) return 'text-muted-foreground';
    return 'text-muted-foreground/60';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Plan Timeline
      </h4>
      
      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex items-center gap-0 min-w-max">
          {snapshots.map((snapshot, index) => {
            const isLatest = index === snapshots.length - 1;
            const date = new Date(snapshot.snapshot_date);
            
            return (
              <div key={snapshot.snapshot_id} className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center min-w-[100px]">
                  {/* Circle */}
                  <div 
                    className={cn(
                      "rounded-full flex items-center justify-center border-2 transition-colors",
                      isLatest 
                        ? "w-4 h-4 bg-primary border-primary" 
                        : "w-3 h-3 bg-muted border-border"
                    )}
                  />
                  
                  {/* Date label */}
                  <span className={cn(
                    "text-xs mt-2 whitespace-nowrap",
                    isLatest ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {format(date, 'MMM d')}
                  </span>
                  
                  {/* Metrics */}
                  <div className="flex flex-col items-center gap-1 mt-1.5">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] h-5 px-1.5",
                        snapshot.plan_type === 'strategic' 
                          ? "bg-primary/5 border-primary/20 text-primary"
                          : "bg-muted/50"
                      )}
                    >
                      {snapshot.plan_type === 'strategic' ? 'Strategic' : 'Standard'}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle className="w-3 h-3" />
                      <span>{snapshot.metrics.tasks_completed} tasks</span>
                    </div>
                    
                    <span className={cn(
                      "text-[10px]",
                      getSmoothnessColor(snapshot.metrics.completion_smoothness)
                    )}>
                      {snapshot.metrics.completion_smoothness}% smooth
                    </span>
                  </div>
                </div>
                
                {/* Connector line (except after last) */}
                {index < snapshots.length - 1 && (
                  <div className="w-8 h-0.5 bg-border -mt-12" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary */}
      <p className="text-xs text-muted-foreground/60 text-center">
        {snapshots.length} plan{snapshots.length === 1 ? '' : 's'} tracked since {format(new Date(snapshots[0].snapshot_date), 'MMMM yyyy')}
      </p>
    </div>
  );
}
