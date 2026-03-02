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
  const navigate = useNavigate();

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
          const hasTask = !!event.task_ref;

          toast({
            title: `⏰ Reminder: ${event.title}`,
            description: `Starts at ${timeStr}`,
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
  }, [user, navigate]);
}
