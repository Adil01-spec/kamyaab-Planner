// Navigation Guard Hook - Prevents accidental state loss
// Note: Uses beforeunload only since app doesn't use data router

import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface UseNavigationGuardOptions {
  // Whether there's an active task that could be lost
  hasActiveTask: boolean;
  // Task title for the warning message
  taskTitle?: string;
  // Whether to show browser's beforeunload dialog
  enableBeforeUnload?: boolean;
  // Callback when user tries to navigate away with active task
  onNavigationAttempt?: () => void;
}

interface UseNavigationGuardReturn {
  // Whether navigation should be blocked (for UI purposes)
  shouldBlock: boolean;
  // Current task title being guarded
  guardedTaskTitle: string;
}

export function useNavigationGuard({
  hasActiveTask,
  taskTitle = 'your task',
  enableBeforeUnload = true,
  onNavigationAttempt,
}: UseNavigationGuardOptions): UseNavigationGuardReturn {
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState(location.pathname);

  // Browser's beforeunload event for tab close/refresh
  useEffect(() => {
    if (!enableBeforeUnload || !hasActiveTask) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message, but we set one anyway
      e.returnValue = `You're working on "${taskTitle}". Your progress will be saved, but the timer will pause. Leave anyway?`;
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveTask, taskTitle, enableBeforeUnload]);

  // Track path changes and notify when navigating with active task
  useEffect(() => {
    if (location.pathname !== previousPath) {
      if (hasActiveTask && onNavigationAttempt) {
        onNavigationAttempt();
      }
      setPreviousPath(location.pathname);
    }
  }, [location.pathname, previousPath, hasActiveTask, onNavigationAttempt]);

  return {
    shouldBlock: hasActiveTask,
    guardedTaskTitle: taskTitle,
  };
}
