// Hook for managing task execution timer state

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  // Initialize timer state from local storage and plan data
  useEffect(() => {
    if (!planData) return;

    // Check for active task in plan data
    const activeTask = findActiveTask(planData);
    
    if (activeTask) {
      const elapsed = calculateElapsedSeconds(activeTask.task.execution_started_at);
      const timerState: ActiveTimerState = {
        weekIndex: activeTask.weekIndex,
        taskIndex: activeTask.taskIndex,
        taskTitle: activeTask.task.title,
        started_at: activeTask.task.execution_started_at,
        elapsed_seconds: elapsed,
      };
      setActiveTimer(timerState);
      setElapsedSeconds(elapsed);
      setLocalActiveTimer(timerState);
    } else {
      // Check local storage as fallback
      const localTimer = getLocalActiveTimer();
      if (localTimer) {
        // Verify the task is still in 'doing' state
        const task = planData.weeks?.[localTimer.weekIndex]?.tasks?.[localTimer.taskIndex];
        if (task?.execution_status === 'doing') {
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
        const newElapsed = calculateElapsedSeconds(activeTimer.started_at);
        setElapsedSeconds(newElapsed);
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

      setIsStarting(true);
      try {
        const result = await startTask(user.id, planData, weekIndex, taskIndex);
        
        if (result.success) {
          onPlanUpdate(result.updatedPlan);
          const task = result.updatedPlan.weeks[weekIndex]?.tasks?.[taskIndex];
          if (task?.execution_started_at) {
            setActiveTimer({
              weekIndex,
              taskIndex,
              taskTitle,
              started_at: task.execution_started_at,
              elapsed_seconds: 0,
            });
            setElapsedSeconds(0);
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
      
      if (task.execution_status === 'doing') return 'doing';
      if (task.execution_status === 'done' || task.completed) return 'done';
      return 'idle';
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
