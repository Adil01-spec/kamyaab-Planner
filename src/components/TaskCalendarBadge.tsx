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
  const isExternal = event.source === 'google' || event.source === 'apple';
  const isConfirmed = event.is_confirmed !== false;
  const showUnconfirmed = isExternal && !isConfirmed && !isCompleted;

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
        showUnconfirmed && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        !showUnconfirmed && isMissed && "bg-destructive/10 text-destructive",
        !showUnconfirmed && isCompleted && "bg-primary/10 text-primary",
        !showUnconfirmed && isUpcoming && !showUnconfirmed && "bg-muted text-muted-foreground"
      )}>
        {showUnconfirmed && <AlertTriangle className="w-2.5 h-2.5" />}
        {!showUnconfirmed && isMissed && <AlertTriangle className="w-2.5 h-2.5" />}
        {!showUnconfirmed && isCompleted && <Check className="w-2.5 h-2.5" />}
        {!showUnconfirmed && isUpcoming && <CalendarClock className="w-2.5 h-2.5" />}
        {showUnconfirmed ? 'Not confirmed' : format(new Date(event.start_time), 'MMM d')}
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
      showUnconfirmed && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      !showUnconfirmed && isMissed && "bg-destructive/10 text-destructive",
      !showUnconfirmed && isCompleted && "bg-primary/10 text-primary/70",
      !showUnconfirmed && isUpcoming && "bg-primary/10 text-primary"
    )}>
      {showUnconfirmed && <AlertTriangle className="w-3.5 h-3.5" />}
      {!showUnconfirmed && isMissed && <AlertTriangle className="w-3.5 h-3.5" />}
      {!showUnconfirmed && isCompleted && <CalendarCheck className="w-3.5 h-3.5" />}
      {!showUnconfirmed && isUpcoming && <CalendarClock className="w-3.5 h-3.5" />}
      <span>
        {showUnconfirmed
          ? `⚠ Not confirmed · ${format(new Date(event.start_time), 'MMM d')}`
          : `✓ ${format(new Date(event.start_time), 'EEE, MMM d · h:mm a')}`
        }
      </span>
    </div>
  );
}
