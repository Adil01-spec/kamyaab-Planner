// Hook for managing task execution timer state

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isTaskInLockedWeek } from '@/lib/weekLockStatus';
import { toast } from 'sonner';
import {
  ActiveTimerState,
  getLocalActiveTimer,
  setLocalActiveTimer,
  calculateElapsedSeconds,
  findActiveTask,
  completeTask,
  calculateTotalTimeSpent,
  areAllTasksCompleted,
  shallowClonePlanWithTaskUpdate,
  shallowClonePlanWithMultiTaskUpdate,
  persistPlanToDb,
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
  getTaskStatus: (weekIndex: number, taskIndex: number) => 'idle' | 'doing' | 'paused' | 'done';
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
  const isMutatingRef = useRef(false);

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

  // Optimistic Start/Resume a task timer
  const startTaskTimer = useCallback(
    async (weekIndex: number, taskIndex: number, taskTitle: string): Promise<boolean> => {
      if (!user?.id || !planData) return false;
      if (isMutatingRef.current) return false;

      // Guard against starting tasks in locked weeks
      if (isTaskInLockedWeek(planData, weekIndex)) {
        console.warn('Cannot start task in locked week');
        return false;
      }

      isMutatingRef.current = true;

      // Snapshot for rollback
      const prevPlan = planData;
      const prevActiveTimer = activeTimer;
      const prevElapsedSeconds = elapsedSeconds;
      const prevLocalStorage = getLocalActiveTimer();

      try {
        const now = new Date().toISOString();
        const taskUpdates: Array<{ weekIndex: number; taskIndex: number; changes: Record<string, any> }> = [];

        // Auto-pause any currently doing task
        const activeTask = findActiveTask(planData);
        if (activeTask) {
          const elapsed = calculateElapsedSeconds(activeTask.task.execution_started_at);
          taskUpdates.push({
            weekIndex: activeTask.weekIndex,
            taskIndex: activeTask.taskIndex,
            changes: {
              execution_state: 'paused',
              execution_started_at: null,
              time_spent_seconds: (activeTask.task.time_spent_seconds || 0) + elapsed,
            },
          });
        }

        // Start the target task
        taskUpdates.push({
          weekIndex,
          taskIndex,
          changes: {
            execution_state: 'doing',
            execution_started_at: now,
          },
        });

        const optimisticPlan = shallowClonePlanWithMultiTaskUpdate(planData, taskUpdates);
        const task = optimisticPlan.weeks[weekIndex]?.tasks?.[taskIndex];
        const accumulated = task?.time_spent_seconds || 0;

        // Immediate UI update
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const newTimer: ActiveTimerState = {
          weekIndex,
          taskIndex,
          taskTitle,
          started_at: now,
          elapsed_seconds: accumulated,
          accumulated_seconds: accumulated,
        };
        setActiveTimer(newTimer);
        setElapsedSeconds(accumulated);
        isLocalOpRef.current = true;
        onPlanUpdate(optimisticPlan);
        setLocalActiveTimer(newTimer);

        // Background DB write
        const result = await persistPlanToDb(user.id, optimisticPlan);
        if (!result.success) {
          // Rollback
          setActiveTimer(prevActiveTimer);
          setElapsedSeconds(prevElapsedSeconds);
          setLocalActiveTimer(prevLocalStorage);
          isLocalOpRef.current = true;
          onPlanUpdate(prevPlan);
          toast.error('Failed to start task. Timer restored.');
          return false;
        }

        return true;
      } finally {
        isMutatingRef.current = false;
      }
    },
    [user?.id, planData, activeTimer, elapsedSeconds, onPlanUpdate]
  );

  // Complete the active task (stays await-based — dialog masks latency)
  const completeTaskTimer = useCallback(async (): Promise<{ success: boolean; timeSpent: number }> => {
    if (!user?.id || !planData || !activeTimer) {
      return { success: false, timeSpent: 0 };
    }
    if (isMutatingRef.current) return { success: false, timeSpent: 0 };
    isMutatingRef.current = true;

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
      isMutatingRef.current = false;
    }
  }, [user?.id, planData, activeTimer, onPlanUpdate]);

  // Optimistic Pause the active task
  const pauseTaskTimer = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !planData || !activeTimer) return false;
    if (isMutatingRef.current) return false;

    isMutatingRef.current = true;

    // Snapshot for rollback
    const prevPlan = planData;
    const prevActiveTimer = activeTimer;
    const prevElapsedSeconds = elapsedSeconds;
    const prevLocalStorage = getLocalActiveTimer();

    try {
      const additionalTime = calculateElapsedSeconds(activeTimer.started_at);
      const task = planData.weeks?.[activeTimer.weekIndex]?.tasks?.[activeTimer.taskIndex];
      const newTimeSpent = (task?.time_spent_seconds || 0) + additionalTime;

      const optimisticPlan = shallowClonePlanWithTaskUpdate(
        planData,
        activeTimer.weekIndex,
        activeTimer.taskIndex,
        {
          execution_state: 'paused',
          execution_started_at: null,
          time_spent_seconds: newTimeSpent,
        }
      );

      // Immediate UI update
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActiveTimer(null);
      setElapsedSeconds(0);
      isLocalOpRef.current = true;
      onPlanUpdate(optimisticPlan);
      setLocalActiveTimer(null);

      // Background DB write
      const result = await persistPlanToDb(user.id, optimisticPlan);
      if (!result.success) {
        // Rollback
        setActiveTimer(prevActiveTimer);
        setElapsedSeconds(prevElapsedSeconds);
        setLocalActiveTimer(prevLocalStorage);
        isLocalOpRef.current = true;
        onPlanUpdate(prevPlan);
        toast.error('Pause failed. Timer restored.');
        return false;
      }

      return true;
    } finally {
      isMutatingRef.current = false;
    }
  }, [user?.id, planData, activeTimer, elapsedSeconds, onPlanUpdate]);

  // Check if a specific task is the active one
  const isTaskActive = useCallback(
    (weekIndex: number, taskIndex: number): boolean => {
      return (
        activeTimer?.weekIndex === weekIndex && activeTimer?.taskIndex === taskIndex
      );
    },
    [activeTimer]
  );

  // Get the status of a specific task using normalized execution state
  const getTaskStatus = useCallback(
    (weekIndex: number, taskIndex: number): 'idle' | 'doing' | 'paused' | 'done' => {
      const task = planData?.weeks?.[weekIndex]?.tasks?.[taskIndex];
      if (!task) return 'idle';

      const state = task.execution_state;
      if (state === 'doing') return 'doing';
      if (state === 'done') return 'done';
      if (state === 'paused') return 'paused';
      if (state === 'idle') return 'idle';
      // Legacy: 'pending' or missing
      if (state === 'pending') {
        return (task.time_spent_seconds ?? 0) > 0 ? 'paused' : 'idle';
      }
      return task.completed ? 'done' : 'idle';
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
