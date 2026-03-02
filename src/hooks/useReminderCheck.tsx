import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const POLL_INTERVAL_MS = 60_000;
const DISMISSED_KEY = 'dismissed_reminder_ids';

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addDismissedId(id: string) {
  const ids = getDismissedIds();
  ids.add(id);
  const arr = [...ids].slice(-200);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
}

export function useReminderCheck() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  try {
    navigateRef.current = useNavigate();
  } catch {
    // Will fall back to window.location if outside Router
  }

  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, start_time, reminder_due_at, task_ref, plan_id')
          .eq('user_id', user.id)
          .eq('reminder_sent', true)
          .not('reminder_due_at', 'is', null)
          .gte('start_time', oneHourAgo);

        if (error || !data) return;

        const dismissed = getDismissedIds();

        for (const event of data) {
          if (dismissed.has(event.id)) continue;

          const startTime = new Date(event.start_time);
          const timeStr = startTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          const dateStr = format(startTime, 'yyyy-MM-dd');
          const nav = navigateRef.current;

          const goToCalendar = () => {
            const url = `/calendar?date=${dateStr}&highlight=${event.id}`;
            if (nav) nav(url);
            else window.location.href = url;
          };

          const goToTask = () => {
            if (nav) nav('/plan');
            else window.location.href = '/plan';
          };

          // Build description with action buttons via HTML-like approach
          // Since shadcn toast doesn't support multiple actions natively,
          // we use description with embedded navigation hints
          const hasTask = !!event.task_ref;

          toast({
            title: `⏰ Reminder: ${event.title}`,
            description: `Starts at ${timeStr}`,
            action: hasTask ? (
              <div className="flex gap-2">
                <button
                  onClick={goToTask}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Open Task
                </button>
                <button
                  onClick={goToCalendar}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium transition-colors hover:opacity-90"
                >
                  Calendar
                </button>
              </div>
            ) : (
              <button
                onClick={goToCalendar}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium transition-colors hover:opacity-90"
              >
                View Calendar
              </button>
            ),
            duration: 10000,
          });

          addDismissedId(event.id);
        }
      } catch {
        // silent fail for polling
      }
    };

    checkReminders();
    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
}
