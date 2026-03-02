import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  // Keep max 200 entries to avoid unbounded growth
  const arr = [...ids].slice(-200);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
}

export function useReminderCheck() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, start_time, reminder_due_at')
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

          toast({
            title: `⏰ Reminder: ${event.title}`,
            description: `Starts at ${timeStr}`,
          });

          addDismissedId(event.id);
        }
      } catch {
        // silent fail for polling
      }
    };

    // Initial check
    checkReminders();

    intervalRef.current = setInterval(checkReminders, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
}
