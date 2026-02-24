// Detailed analytics summary for completed plans

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Timer, Flame, Target, Calendar, BarChart3 } from 'lucide-react';
import { formatTotalTime } from '@/lib/executionTimer';
import type { CompletionAnalytics } from '@/lib/planCompletion';

interface PlanCompletionSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: CompletionAnalytics;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
            {detail && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{detail}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlanCompletionSummary({
  open,
  onOpenChange,
  analytics,
}: PlanCompletionSummaryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-5 h-5 text-primary" />
            Execution Summary
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <StatCard
            icon={Clock}
            label="Total Hours Tracked"
            value={`${analytics.totalHoursTracked}h`}
            detail={formatTotalTime(analytics.totalTimeSpentSeconds)}
          />
          <StatCard
            icon={Timer}
            label="Avg. Daily Execution"
            value={`${analytics.averageDailyExecutionMinutes}m`}
            detail="Per active day"
          />
          <StatCard
            icon={Flame}
            label="Longest Session"
            value={analytics.longestSession ? formatTotalTime(analytics.longestSession.seconds) : 'N/A'}
            detail={analytics.longestSession?.taskTitle}
          />
          <StatCard
            icon={Target}
            label="Most Worked Task"
            value={analytics.mostWorkedTask ? formatTotalTime(analytics.mostWorkedTask.seconds) : 'N/A'}
            detail={analytics.mostWorkedTask?.taskTitle}
          />
          <StatCard
            icon={BarChart3}
            label="Execution Sessions"
            value={`${analytics.totalExecutionSessions}`}
            detail="Tasks with tracked time"
          />
          <StatCard
            icon={Calendar}
            label="Days Active"
            value={`${analytics.totalDaysActive}`}
            detail="From start to completion"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
