import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TaskCalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: string;
  task_ref: string;
  plan_id: string | null;
}

/**
 * Hook to fetch calendar events linked to plan tasks (by plan_id).
 * Returns a map of task_ref → CalendarEvent for quick lookup.
 */
export function useTaskCalendarEvents(planId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: eventMap = new Map<string, TaskCalendarEvent>(), isLoading } = useQuery({
    queryKey: ['task-calendar-events', planId, user?.id],
    queryFn: async () => {
      if (!user || !planId) return new Map<string, TaskCalendarEvent>();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_time, end_time, status, task_ref, plan_id')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .not('task_ref', 'is', null);

      if (error) throw error;

      const map = new Map<string, TaskCalendarEvent>();
      (data || []).forEach((ev) => {
        if (ev.task_ref) {
          map.set(ev.task_ref, ev as TaskCalendarEvent);
        }
      });
      return map;
    },
    enabled: !!user && !!planId,
  });

  const updateEventStatus = useMutation({
    mutationFn: async ({ taskRef, status }: { taskRef: string; status: string }) => {
      if (!user || !planId) throw new Error('Missing context');
      const event = eventMap.get(taskRef);
      if (!event) return;

      const { error } = await supabase
        .from('calendar_events')
        .update({ status })
        .eq('id', event.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  return { eventMap, isLoading, updateEventStatus };
}

/**
 * Hook to get today's calendar events for the Today page.
 */
export function useTodayCalendarEvents() {
  const { user } = useAuth();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  const { data: todayEvents = [], isLoading } = useQuery({
    queryKey: ['today-calendar-events', user?.id, startOfDay],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .in('status', ['upcoming', 'missed'])
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return { todayEvents, isLoading };
}

/**
 * Hook to get count of missed events for banners.
 */
export function useMissedEventCount() {
  const { user } = useAuth();

  const { data: missedCount = 0 } = useQuery({
    queryKey: ['missed-event-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'missed');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  return missedCount;
}
