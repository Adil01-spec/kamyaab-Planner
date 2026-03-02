import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  user_id: string;
  plan_id: string | null;
  task_ref: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  reminder_minutes: number | null;
  source: string;
  external_event_id: string | null;
  reminder_sent: boolean;
  created_at: string;
  status: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  reminder_minutes?: number;
  plan_id?: string;
  task_ref?: string;
  source?: string;
}

export interface UpdateCalendarEventInput {
  id: string;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  reminder_minutes?: number;
}

export function useCalendarEvents(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['calendar-events', user?.id, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()];

  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (dateRange) {
        query = query
          .gte('start_time', dateRange.start.toISOString())
          .lte('start_time', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          start_time: input.start_time,
          end_time: input.end_time || null,
          reminder_minutes: input.reminder_minutes ?? 10,
          plan_id: input.plan_id || null,
          task_ref: input.task_ref || null,
          source: input.source || 'in_app',
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event created', description: 'Added to your calendar.' });
    },
    onError: (error) => {
      console.error('Create event error:', error);
      toast({ title: 'Failed to create event', description: 'Please try again.', variant: 'destructive' });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (input: UpdateCalendarEventInput) => {
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, any> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.start_time !== undefined) updates.start_time = input.start_time;
      if (input.end_time !== undefined) updates.end_time = input.end_time;
      if (input.reminder_minutes !== undefined) updates.reminder_minutes = input.reminder_minutes;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ title: 'Event deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    },
  });

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
