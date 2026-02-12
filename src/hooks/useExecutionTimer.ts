// Hook for managing task execution timer state

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';
import {
  ActiveTimerState,
  getLocalActiveTimer,
  setLocalActiveTimer,
  calculateElapsedSeconds,
  findActiveTask,
  startTask,
  completeTask,
  pauseTask,
  calculateTotalTimeSpent,
  areAllTasksCompleted,
} from '@/lib/executionTimer';

interface UseExecutionTimerOptions {
  planData: any;
  planId: string | null;
  onPlanUpdate: (updatedPlan: any) => void;
}

interface UseExecutionTimerReturn {
  activeTimer: ActiveTimerState | null;
  elapsedSeconds: number;
  isStarting: boolean;
  isCompleting: boolean;
  isPausing: boolean;
  totalTimeSpent: number;
  allTasksCompleted: boolean;
  startTaskTimer: (weekIndex: number, taskIndex: number, taskTitle: string) => Promise<boolean>;
  completeTaskTimer: () => Promise<{ success: boolean; timeSpent: number }>;
  pauseTaskTimer: () => Promise<boolean>;
  isTaskActive: (weekIndex: number, taskIndex: number) => boolean;
  getTaskStatus: (weekIndex: number, taskIndex: number) => 'idle' | 'doing' | 'done';
}

export function useExecutionTimer({
  planData,
  planId,
  onPlanUpdate,
}: UseExecutionTimerOptions): UseExecutionTimerReturn {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalOpRef = useRef(false);

  // Initialize timer state from local storage and plan data
  useEffect(() => {
    if (!planData) return;

    // Skip re-initialization if this planData change was triggered by a local operation
    if (isLocalOpRef.current) {
      isLocalOpRef.current = false;
      return;
    }

    // Check for active task in plan data
    const activeTask = findActiveTask(planData);
    
    if (activeTask) {
      const liveElapsed = calculateElapsedSeconds(activeTask.task.execution_started_at);
      const accumulated = activeTask.task.time_spent_seconds || 0;
      const timerState: ActiveTimerState = {
        weekIndex: activeTask.weekIndex,
        taskIndex: activeTask.taskIndex,
        taskTitle: activeTask.task.title,
        started_at: activeTask.task.execution_started_at,
        elapsed_seconds: accumulated + liveElapsed,
        accumulated_seconds: accumulated,
      };
      setActiveTimer(timerState);
      setElapsedSeconds(accumulated + liveElapsed);
      setLocalActiveTimer(timerState);
    } else {
      // Check local storage as fallback
      const localTimer = getLocalActiveTimer();
      if (localTimer) {
        // Verify the task is still in 'doing' state
        const task = planData.weeks?.[localTimer.weekIndex]?.tasks?.[localTimer.taskIndex];
        const isDoing = task?.execution_state === 'doing';
        if (isDoing) {
          const elapsed = calculateElapsedSeconds(localTimer.started_at);
          setActiveTimer({ ...localTimer, elapsed_seconds: elapsed });
          setElapsedSeconds(elapsed);
        } else {
          // Clear stale local timer
          setLocalActiveTimer(null);
          setActiveTimer(null);
          setElapsedSeconds(0);
        }
      } else {
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
    }
  }, [planData]);

  // Tick the timer every second when active
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        const liveElapsed = calculateElapsedSeconds(activeTimer.started_at);
        setElapsedSeconds((activeTimer.accumulated_seconds || 0) + liveElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer?.started_at]);

  // Start a task timer
  const startTaskTimer = useCallback(
    async (weekIndex: number, taskIndex: number, taskTitle: string): Promise<boolean> => {
      if (!user?.id || !planData) return false;

      // Guard against starting tasks in locked weeks
      if (isTaskInLockedWeek(planData, weekIndex)) {
        console.warn('Cannot start task in locked week');
        return false;
      }

      setIsStarting(true);
      try {
        const result = await startTask(user.id, planData, weekIndex, taskIndex);
        
        if (result.success) {
          isLocalOpRef.current = true;
          onPlanUpdate(result.updatedPlan);
          const task = result.updatedPlan.weeks[weekIndex]?.tasks?.[taskIndex];
          if (task?.execution_started_at) {
            const accumulated = task.time_spent_seconds || 0;
            setActiveTimer({
              weekIndex,
              taskIndex,
              taskTitle,
              started_at: task.execution_started_at,
              elapsed_seconds: accumulated,
              accumulated_seconds: accumulated,
            });
            setElapsedSeconds(accumulated);
          }
        }
        
        return result.success;
      } finally {
        setIsStarting(false);
      }
    },
    [user?.id, planData, onPlanUpdate]
  );

  // Complete the active task
  const completeTaskTimer = useCallback(async (): Promise<{ success: boolean; timeSpent: number }> => {
    if (!user?.id || !planData || !activeTimer) {
      return { success: false, timeSpent: 0 };
    }

    setIsCompleting(true);
    try {
      const result = await completeTask(
        user.id,
        planData,
        activeTimer.weekIndex,
        activeTimer.taskIndex
      );
      
      if (result.success) {
        isLocalOpRef.current = true;
        onPlanUpdate(result.updatedPlan);
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
      
      return { success: result.success, timeSpent: result.timeSpent };
    } finally {
      setIsCompleting(false);
    }
  }, [user?.id, planData, activeTimer, onPlanUpdate]);

  // Pause the active task
  const pauseTaskTimer = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !planData || !activeTimer) return false;

    setIsPausing(true);
    try {
      const result = await pauseTask(
        user.id,
        planData,
        activeTimer.weekIndex,
        activeTimer.taskIndex
      );
      
      if (result.success) {
        isLocalOpRef.current = true;
        onPlanUpdate(result.updatedPlan);
        setActiveTimer(null);
        setElapsedSeconds(0);
      }
      
      return result.success;
    } finally {
      setIsPausing(false);
    }
  }, [user?.id, planData, activeTimer, onPlanUpdate]);

  // Check if a specific task is the active one
  const isTaskActive = useCallback(
    (weekIndex: number, taskIndex: number): boolean => {
      return (
        activeTimer?.weekIndex === weekIndex && activeTimer?.taskIndex === taskIndex
      );
    },
    [activeTimer]
  );

  // Get the status of a specific task
  const getTaskStatus = useCallback(
    (weekIndex: number, taskIndex: number): 'idle' | 'doing' | 'done' => {
      const task = planData?.weeks?.[weekIndex]?.tasks?.[taskIndex];
      if (!task) return 'idle';

      if (task.execution_state === 'doing') return 'doing';
      if (task.execution_state === 'done' || task.completed) return 'done';
      return 'idle'; // pending maps to idle for UI compatibility
    },
    [planData]
  );

  // Calculate total time spent
  const totalTimeSpent = planData ? calculateTotalTimeSpent(planData) : 0;

  // Check if all tasks are completed
  const allTasksCompleted = planData ? areAllTasksCompleted(planData) : false;

  return {
    activeTimer,
    elapsedSeconds,
    isStarting,
    isCompleting,
    isPausing,
    totalTimeSpent,
    allTasksCompleted,
    startTaskTimer,
    completeTaskTimer,
    pauseTaskTimer,
    isTaskActive,
    getTaskStatus,
  };
}
