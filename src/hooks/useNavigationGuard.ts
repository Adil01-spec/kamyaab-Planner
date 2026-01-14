// Navigation Guard Hook - Prevents accidental state loss

import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseNavigationGuardOptions {
  // Whether there's an active task that could be lost
  hasActiveTask: boolean;
  // Task title for the warning message
  taskTitle?: string;
  // Whether to show browser's beforeunload dialog
  enableBeforeUnload?: boolean;
  // Whether to block route navigation
  enableRouteGuard?: boolean;
}

interface UseNavigationGuardReturn {
  // Whether navigation is currently blocked
  isBlocked: boolean;
  // Function to confirm navigation and proceed
  confirmNavigation: () => void;
  // Function to cancel navigation and stay
  cancelNavigation: () => void;
  // The blocked location (if any)
  blockedLocation: string | null;
}

export function useNavigationGuard({
  hasActiveTask,
  taskTitle = 'your task',
  enableBeforeUnload = true,
  enableRouteGuard = true,
}: UseNavigationGuardOptions): UseNavigationGuardReturn {
  const [blockedLocation, setBlockedLocation] = useState<string | null>(null);

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

  // React Router blocker for in-app navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enableRouteGuard &&
      hasActiveTask &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Update blocked location when blocker state changes
  useEffect(() => {
    if (blocker.state === 'blocked' && blocker.location) {
      setBlockedLocation(blocker.location.pathname);
    } else {
      setBlockedLocation(null);
    }
  }, [blocker.state, blocker.location]);

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed?.();
    }
    setBlockedLocation(null);
  }, [blocker]);

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset?.();
    }
    setBlockedLocation(null);
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
    blockedLocation,
  };
}
