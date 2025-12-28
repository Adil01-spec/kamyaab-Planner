import { useState, useEffect, useCallback } from 'react';

export type CalendarStatus = 'not_added' | 'pending_confirmation' | 'added';

export interface CalendarTaskStatus {
  status: CalendarStatus;
  calendarIntentStartedAt?: number;
  calendarConfirmedAt?: number;
  scheduledAt?: string; // ISO datetime - the date user chose for the calendar event
  draftScheduledAt?: string; // ISO datetime - temporarily stored before confirmation
}

interface CalendarStatusStore {
  [taskKey: string]: CalendarTaskStatus;
}

const STORAGE_KEY = 'kaamyab-calendar-status';
const PENDING_EXPIRY_HOURS = 24;

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

// Set task to pending confirmation with draft date
export const setTaskPendingConfirmation = (weekNumber: number, taskIndex: number, draftDate?: Date) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'pending_confirmation',
    calendarIntentStartedAt: Date.now(),
    draftScheduledAt: draftDate?.toISOString(),
  };
  saveCalendarStatusStore(store);
};

// Confirm task was added to calendar - moves draftScheduledAt to scheduledAt
export const confirmTaskCalendarAdded = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  const existingStatus: CalendarTaskStatus = store[taskKey] || { status: 'not_added' };
  
  // Validate date is not in the past
  const draftDate = existingStatus.draftScheduledAt;
  let scheduledAt = draftDate;
  
  if (draftDate) {
    const dateObj = new Date(draftDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
      // Date is in the past, clear it - user will need to re-add
      scheduledAt = undefined;
    }
  }
  
  store[taskKey] = {
    status: 'added',
    calendarConfirmedAt: Date.now(),
    scheduledAt: scheduledAt,
  };
  saveCalendarStatusStore(store);
  
  return { hasValidDate: !!scheduledAt };
};

// Reset task to not added (user said no or wants to retry)
export const resetTaskCalendarStatus = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'not_added',
    // Clear all dates
    scheduledAt: undefined,
    draftScheduledAt: undefined,
  };
  saveCalendarStatusStore(store);
};

// Get all pending confirmation tasks
export const getPendingConfirmationTasks = (): { 
  weekNumber: number; 
  taskIndex: number; 
  intentStartedAt: number;
  draftScheduledAt?: string;
}[] => {
  const store = getCalendarStatusStore();
  const pendingTasks: { 
    weekNumber: number; 
    taskIndex: number; 
    intentStartedAt: number;
    draftScheduledAt?: string;
  }[] = [];
  
  Object.entries(store).forEach(([taskKey, status]) => {
    if (status.status === 'pending_confirmation' && status.calendarIntentStartedAt) {
      // Parse week number and task index from key
      const match = taskKey.match(/^week-(\d+)-task-(\d+)$/);
      if (match) {
        const weekNumber = parseInt(match[1], 10);
        const taskIndex = parseInt(match[2], 10);
        
        // Check if not expired (24 hours)
        const hoursSinceIntent = (Date.now() - status.calendarIntentStartedAt) / (1000 * 60 * 60);
        if (hoursSinceIntent < PENDING_EXPIRY_HOURS) {
          pendingTasks.push({
            weekNumber,
            taskIndex,
            intentStartedAt: status.calendarIntentStartedAt,
            draftScheduledAt: status.draftScheduledAt,
          });
        } else {
          // Auto-clear expired pending states
          resetTaskCalendarStatus(weekNumber, taskIndex);
        }
      }
    }
  });
  
  return pendingTasks;
};

// Get all tasks that are confirmed added with valid scheduled dates
export const getConfirmedCalendarTasks = (): {
  weekNumber: number;
  taskIndex: number;
  scheduledAt: string;
}[] => {
  const store = getCalendarStatusStore();
  const confirmedTasks: {
    weekNumber: number;
    taskIndex: number;
    scheduledAt: string;
  }[] = [];
  
  Object.entries(store).forEach(([taskKey, status]) => {
    if (status.status === 'added' && status.scheduledAt) {
      const match = taskKey.match(/^week-(\d+)-task-(\d+)$/);
      if (match) {
        confirmedTasks.push({
          weekNumber: parseInt(match[1], 10),
          taskIndex: parseInt(match[2], 10),
          scheduledAt: status.scheduledAt,
        });
      }
    }
  });
  
  return confirmedTasks;
};

// Clear pending status for completed tasks
export const clearPendingForCompletedTask = (weekNumber: number, taskIndex: number) => {
  const status = getTaskCalendarStatus(weekNumber, taskIndex);
  if (status.status === 'pending_confirmation') {
    resetTaskCalendarStatus(weekNumber, taskIndex);
  }
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
  
  // Set to pending confirmation with draft date
  const setPending = useCallback((draftDate?: Date) => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      setTaskPendingConfirmation(weekNumber, taskIndex, draftDate);
      setStatus({
        status: 'pending_confirmation',
        calendarIntentStartedAt: Date.now(),
        draftScheduledAt: draftDate?.toISOString(),
      });
    }
  }, [weekNumber, taskIndex]);
  
  // Confirm added - moves draft date to confirmed
  const confirmAdded = useCallback(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      const result = confirmTaskCalendarAdded(weekNumber, taskIndex);
      const updatedStatus = getTaskCalendarStatus(weekNumber, taskIndex);
      setStatus(updatedStatus);
      return result;
    }
    return { hasValidDate: false };
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
    intentStartedAt: status.calendarIntentStartedAt,
    confirmedAt: status.calendarConfirmedAt,
    scheduledAt: status.scheduledAt,
    draftScheduledAt: status.draftScheduledAt,
    setPending,
    confirmAdded,
    reset,
  };
}

// Hook to detect pending confirmation tasks on visibility change
export function usePendingCalendarConfirmation() {
  const [pendingTask, setPendingTask] = useState<{
    weekNumber: number;
    taskIndex: number;
    intentStartedAt: number;
    draftScheduledAt?: string;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Check for pending tasks
  const checkPendingTasks = useCallback(() => {
    const pending = getPendingConfirmationTasks();
    if (pending.length > 0) {
      // Show confirmation for the most recent pending task
      const mostRecent = pending.sort((a, b) => b.intentStartedAt - a.intentStartedAt)[0];
      setPendingTask(mostRecent);
      setShowConfirmation(true);
    }
  }, []);
  
  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to let the user orient themselves
        setTimeout(checkPendingTasks, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check on mount
    checkPendingTasks();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkPendingTasks]);
  
  // Handle user confirmation
  const handleConfirm = useCallback((): { hasValidDate: boolean } => {
    if (pendingTask) {
      const result = confirmTaskCalendarAdded(pendingTask.weekNumber, pendingTask.taskIndex);
      setShowConfirmation(false);
      
      // Check if there are more pending tasks
      setTimeout(() => {
        const remaining = getPendingConfirmationTasks();
        if (remaining.length > 0) {
          const mostRecent = remaining.sort((a, b) => b.intentStartedAt - a.intentStartedAt)[0];
          setPendingTask(mostRecent);
          setShowConfirmation(true);
        } else {
          setPendingTask(null);
        }
      }, 300);
      
      return result;
    }
    return { hasValidDate: false };
  }, [pendingTask]);
  
  // Handle user denial
  const handleDeny = useCallback(() => {
    if (pendingTask) {
      resetTaskCalendarStatus(pendingTask.weekNumber, pendingTask.taskIndex);
      setShowConfirmation(false);
      
      // Check if there are more pending tasks
      setTimeout(() => {
        const remaining = getPendingConfirmationTasks();
        if (remaining.length > 0) {
          const mostRecent = remaining.sort((a, b) => b.intentStartedAt - a.intentStartedAt)[0];
          setPendingTask(mostRecent);
          setShowConfirmation(true);
        } else {
          setPendingTask(null);
        }
      }, 300);
    }
  }, [pendingTask]);
  
  // Handle dismiss (remind later)
  const handleDismiss = useCallback(() => {
    setShowConfirmation(false);
  }, []);
  
  // Force a refresh of calendar data (for WeeklyCalendarView to rerender)
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);
  
  return {
    pendingTask,
    showConfirmation,
    setShowConfirmation,
    handleConfirm,
    handleDeny,
    handleDismiss,
    checkPendingTasks,
    refreshKey,
    triggerRefresh,
  };
}
