import { useNavigate } from 'react-router-dom';
import { useTodayCalendarEvents } from '@/hooks/useTaskCalendarEvents';
import { Clock, CalendarDays, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function TodayScheduleSection() {
  const navigate = useNavigate();
  const { todayEvents, isLoading } = useTodayCalendarEvents();

  if (isLoading || todayEvents.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border/30 bg-card/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Today's Schedule</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary h-7 px-2"
          onClick={() => navigate('/calendar')}
        >
          View Calendar <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="divide-y divide-border/10">
        {todayEvents.map((ev) => (
          <button
            key={ev.id}
            onClick={() => {
              if (ev.task_ref && ev.plan_id) {
                navigate(`/plan?highlight=${ev.task_ref}`);
              } else {
                navigate(`/calendar?highlight=${ev.id}`);
              }
            }}
            className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors flex items-center gap-3"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              ev.status === 'missed' ? "bg-destructive/10" : "bg-primary/10"
            )}>
              {ev.status === 'missed'
                ? <AlertTriangle className="w-4 h-4 text-destructive" />
                : <Clock className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(ev.start_time), 'h:mm a')}
                {ev.end_time && ` – ${format(new Date(ev.end_time), 'h:mm a')}`}
              </p>
            </div>
            {ev.status === 'missed' && (
              <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">Missed</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
