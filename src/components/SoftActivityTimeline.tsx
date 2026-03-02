import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subDays, isAfter, parseISO } from 'date-fns';

interface DayClosure {
  date: string;
  completed_tasks?: number;
  total_tasks?: number;
  [key: string]: any;
}

interface SoftActivityTimelineProps {
  dayClosure: DayClosure[];
  planCreatedAt: string;
  totalTasks: number;
  completedTasks: number;
}

const SoftActivityTimeline = ({ dayClosure, planCreatedAt, totalTasks, completedTasks }: SoftActivityTimelineProps) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const closure = dayClosure.find(c => c.date === dateStr);
      days.push({
        day: format(date, 'EEE'),
        completed: closure?.completed_tasks || 0,
      });
    }
    return days;
  }, [dayClosure]);

  const recentClosures = useMemo(() => {
    const cutoff = subDays(new Date(), 7);
    return dayClosure
      .filter(c => {
        try { return isAfter(parseISO(c.date), cutoff); } catch { return false; }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [dayClosure]);

  const hasActivity = chartData.some(d => d.completed > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          7-Day Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress summary */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {completedTasks}/{totalTasks} tasks completed
          </span>
          <span className="text-xs text-muted-foreground">
            Since {format(parseISO(planCreatedAt), 'MMM d')}
          </span>
        </div>

        {/* Bar chart */}
        {hasActivity ? (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No activity in the last 7 days</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SoftActivityTimeline;
