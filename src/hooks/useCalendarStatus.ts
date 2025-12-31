import { useState, useEffect, useCallback } from 'react';

// Simplified calendar status - only two states, user-driven
export type CalendarStatus = 'not_added' | 'scheduled';

export interface CalendarTaskStatus {
  status: CalendarStatus;
  scheduledAt?: string; // ISO datetime - only set when user explicitly confirms
}

interface CalendarStatusStore {
  [taskKey: string]: CalendarTaskStatus;
}

const STORAGE_KEY = 'kaamyab-calendar-status';

// Get all calendar statuses from localStorage
const getCalendarStatusStore = (): CalendarStatusStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save calendar statuses to localStorage
const saveCalendarStatusStore = (store: CalendarStatusStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

// Get task key from week number and task index
export const getTaskKey = (weekNumber: number, taskIndex: number): string => {
  return `week-${weekNumber}-task-${taskIndex}`;
};

// Get the status for a specific task
export const getTaskCalendarStatus = (weekNumber: number, taskIndex: number): CalendarTaskStatus => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  return store[taskKey] || { status: 'not_added' };
};

// Mark task as scheduled with a specific date - called when user explicitly confirms
export const markTaskAsScheduled = (weekNumber: number, taskIndex: number, scheduledAt: Date) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'scheduled',
    scheduledAt: scheduledAt.toISOString(),
  };
  saveCalendarStatusStore(store);
};

// Reset task calendar status - user wants to add again
export const resetTaskCalendarStatus = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'not_added',
  };
  saveCalendarStatusStore(store);
};

// Get all scheduled tasks (for weekly calendar view)
export const getScheduledCalendarTasks = (): {
  weekNumber: number;
  taskIndex: number;
  scheduledAt: string;
}[] => {
  const store = getCalendarStatusStore();
  const scheduledTasks: {
    weekNumber: number;
    taskIndex: number;
    scheduledAt: string;
  }[] = [];
  
  Object.entries(store).forEach(([taskKey, status]) => {
    if (status.status === 'scheduled' && status.scheduledAt) {
      const match = taskKey.match(/^week-(\d+)-task-(\d+)$/);
      if (match) {
        scheduledTasks.push({
          weekNumber: parseInt(match[1], 10),
          taskIndex: parseInt(match[2], 10),
          scheduledAt: status.scheduledAt,
        });
      }
    }
  });
  
  return scheduledTasks;
};

// Hook for managing calendar status for a specific task
export function useTaskCalendarStatus(weekNumber?: number, taskIndex?: number) {
  const [status, setStatus] = useState<CalendarTaskStatus>({ status: 'not_added' });
  
  // Load initial status
  useEffect(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      setStatus(getTaskCalendarStatus(weekNumber, taskIndex));
    }
  }, [weekNumber, taskIndex]);
  
  // Refresh status from storage
  const refresh = useCallback(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      setStatus(getTaskCalendarStatus(weekNumber, taskIndex));
    }
  }, [weekNumber, taskIndex]);
  
  // Mark as scheduled with explicit date
  const markScheduled = useCallback((scheduledAt: Date) => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      markTaskAsScheduled(weekNumber, taskIndex, scheduledAt);
      setStatus({
        status: 'scheduled',
        scheduledAt: scheduledAt.toISOString(),
      });
    }
  }, [weekNumber, taskIndex]);
  
  // Reset to not added
  const reset = useCallback(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      resetTaskCalendarStatus(weekNumber, taskIndex);
      setStatus({ status: 'not_added' });
    }
  }, [weekNumber, taskIndex]);
  
  return {
    status: status.status,
    scheduledAt: status.scheduledAt,
    markScheduled,
    reset,
    refresh,
  };
}

// Legacy export for backward compatibility - now uses 'scheduled' status
export const getConfirmedCalendarTasks = getScheduledCalendarTasks;
