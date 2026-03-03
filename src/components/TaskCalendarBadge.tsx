import { CalendarCheck, CalendarClock, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { TaskCalendarEvent } from '@/hooks/useTaskCalendarEvents';

interface TaskCalendarBadgeProps {
  event: TaskCalendarEvent;
  compact?: boolean;
}

export function TaskCalendarBadge({ event, compact = false }: TaskCalendarBadgeProps) {
  const isMissed = event.status === 'missed';
  const isCompleted = event.status === 'completed';
  const isUpcoming = event.status === 'upcoming';

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
        isMissed && "bg-destructive/10 text-destructive",
        isCompleted && "bg-primary/10 text-primary",
        isUpcoming && "bg-muted text-muted-foreground"
      )}>
        {isMissed && <AlertTriangle className="w-2.5 h-2.5" />}
        {isCompleted && <Check className="w-2.5 h-2.5" />}
        {isUpcoming && <CalendarClock className="w-2.5 h-2.5" />}
        {format(new Date(event.start_time), 'MMM d')}
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
      isMissed && "bg-destructive/10 text-destructive",
      isCompleted && "bg-primary/10 text-primary/70",
      isUpcoming && "bg-primary/10 text-primary"
    )}>
      {isMissed && <AlertTriangle className="w-3.5 h-3.5" />}
      {isCompleted && <CalendarCheck className="w-3.5 h-3.5" />}
      {isUpcoming && <CalendarClock className="w-3.5 h-3.5" />}
      <span>{format(new Date(event.start_time), 'EEE, MMM d · h:mm a')}</span>
    </div>
  );
}
