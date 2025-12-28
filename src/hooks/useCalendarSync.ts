import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  syncWeekToCalendar,
  distributeTasksAcrossWeek,
  getCurrentWeekStart,
  isWeekSynced,
} from '@/lib/calendarService';
import { markWeekTasksAsCalendarAdded } from '@/components/TaskItem';

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface UseCalendarSyncOptions {
  userId: string;
  weeks: Week[];
}

interface CalendarSyncState {
  isSyncing: boolean;
  syncingWeek: number | null;
}

export const useCalendarSync = ({ userId, weeks }: UseCalendarSyncOptions) => {
  const [state, setState] = useState<CalendarSyncState>({
    isSyncing: false,
    syncingWeek: null,
  });

  // Determine the current active week (first incomplete week)
  const getCurrentActiveWeek = useCallback((): number | null => {
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const allCompleted = week.tasks.every(t => t.completed);
      if (!allCompleted) {
        return i;
      }
    }
    return null; // All weeks completed
  }, [weeks]);

  // Check if a week can be synced to calendar
  const canSyncWeek = useCallback((weekIndex: number): boolean => {
    const activeWeekIndex = getCurrentActiveWeek();
    
    // Can only sync the current active week
    if (activeWeekIndex === null || weekIndex !== activeWeekIndex) {
      return false;
    }

    // Check if already synced this session
    const week = weeks[weekIndex];
    if (isWeekSynced(userId, week.week)) {
      return false;
    }

    // Check if week is fully completed (locked)
    const allCompleted = week.tasks.every(t => t.completed);
    if (allCompleted) {
      return false;
    }

    return true;
  }, [weeks, userId, getCurrentActiveWeek]);

  // Get reason why week cannot be synced
  const getDisabledReason = useCallback((weekIndex: number): string | null => {
    const activeWeekIndex = getCurrentActiveWeek();
    const week = weeks[weekIndex];
    
    // Already synced
    if (isWeekSynced(userId, week.week)) {
      return 'Already added to calendar';
    }

    // Week is completed
    const allCompleted = week.tasks.every(t => t.completed);
    if (allCompleted) {
      return 'Week completed';
    }

    // Not the active week (future week)
    if (activeWeekIndex !== null && weekIndex > activeWeekIndex) {
      return 'Complete current week first';
    }

    return null;
  }, [weeks, userId, getCurrentActiveWeek]);

  // Sync a week to calendar
  const syncWeek = useCallback(async (weekIndex: number): Promise<boolean> => {
    if (!canSyncWeek(weekIndex)) {
      const reason = getDisabledReason(weekIndex);
      toast({
        title: 'Cannot add to calendar',
        description: reason || 'This week cannot be added to your calendar right now.',
        variant: 'destructive',
      });
      return false;
    }

    const week = weeks[weekIndex];
    
    setState({
      isSyncing: true,
      syncingWeek: week.week,
    });

    try {
      // Get incomplete tasks only
      const incompleteTasks = week.tasks.filter(t => !t.completed);
      
      if (incompleteTasks.length === 0) {
        toast({
          title: 'No tasks to add',
          description: 'All tasks in this week are already completed.',
        });
        return false;
      }

      // Distribute tasks across the week with week number for title prefix
      const weekStart = getCurrentWeekStart();
      const calendarTasks = distributeTasksAcrossWeek(incompleteTasks, weekStart, week.week);

      // Sync to calendar
      const result = await syncWeekToCalendar(calendarTasks, userId, week.week);

      if (result.success) {
        // Mark all tasks in this week as added to calendar for visual indicator
        markWeekTasksAsCalendarAdded(week.week, week.tasks.length);
        
        if (result.eventsCreated > 0) {
          toast({
            title: `${result.eventsCreated} task${result.eventsCreated > 1 ? 's' : ''} added to your calendar`,
            description: "Focus and execute. You've got this!",
          });
        } else if (result.error) {
          // Already synced case
          toast({
            title: 'Already synced',
            description: result.error,
          });
        }
        return true;
      } else {
        toast({
          title: 'Some tasks could not be added',
          description: result.error || 'Please retry or add tasks individually.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast({
        title: 'Calendar sync failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setState({
        isSyncing: false,
        syncingWeek: null,
      });
    }
  }, [weeks, userId, canSyncWeek, getDisabledReason]);

  return {
    isSyncing: state.isSyncing,
    syncingWeek: state.syncingWeek,
    syncWeek,
    canSyncWeek,
    getDisabledReason,
    getCurrentActiveWeek,
  };
};
