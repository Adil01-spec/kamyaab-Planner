import { useState, useEffect, useCallback } from 'react';

export type CalendarStatus = 'not_added' | 'pending_confirmation' | 'added';

export interface CalendarTaskStatus {
  status: CalendarStatus;
  calendarIntentStartedAt?: number;
  calendarConfirmedAt?: number;
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

// Set task to pending confirmation
export const setTaskPendingConfirmation = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'pending_confirmation',
    calendarIntentStartedAt: Date.now(),
  };
  saveCalendarStatusStore(store);
};

// Confirm task was added to calendar
export const confirmTaskCalendarAdded = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'added',
    calendarConfirmedAt: Date.now(),
  };
  saveCalendarStatusStore(store);
};

// Reset task to not added (user said no)
export const resetTaskCalendarStatus = (weekNumber: number, taskIndex: number) => {
  const taskKey = getTaskKey(weekNumber, taskIndex);
  const store = getCalendarStatusStore();
  store[taskKey] = {
    status: 'not_added',
  };
  saveCalendarStatusStore(store);
};

// Get all pending confirmation tasks
export const getPendingConfirmationTasks = (): { weekNumber: number; taskIndex: number; intentStartedAt: number }[] => {
  const store = getCalendarStatusStore();
  const pendingTasks: { weekNumber: number; taskIndex: number; intentStartedAt: number }[] = [];
  
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
  
  // Set to pending confirmation
  const setPending = useCallback(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      setTaskPendingConfirmation(weekNumber, taskIndex);
      setStatus({
        status: 'pending_confirmation',
        calendarIntentStartedAt: Date.now(),
      });
    }
  }, [weekNumber, taskIndex]);
  
  // Confirm added
  const confirmAdded = useCallback(() => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      confirmTaskCalendarAdded(weekNumber, taskIndex);
      setStatus({
        status: 'added',
        calendarConfirmedAt: Date.now(),
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
    intentStartedAt: status.calendarIntentStartedAt,
    confirmedAt: status.calendarConfirmedAt,
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
  const handleConfirm = useCallback(() => {
    if (pendingTask) {
      confirmTaskCalendarAdded(pendingTask.weekNumber, pendingTask.taskIndex);
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
  
  return {
    pendingTask,
    showConfirmation,
    setShowConfirmation,
    handleConfirm,
    handleDeny,
    handleDismiss,
    checkPendingTasks,
  };
}
