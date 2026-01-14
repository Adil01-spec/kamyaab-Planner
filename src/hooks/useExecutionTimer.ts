// Hook for managing task execution timer state
// Phase 7.7: Enhanced with recovery detection, error handling, and trust indicators

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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
  markTimerAsRecovered,
  wasTimerRecovered,
  isTimerStale,
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
  // Phase 7.7: New trust indicators
  isRecoveredSession: boolean;
  saveError: string | null;
  lastSaveTime: Date | null;
  // Core functions
  startTaskTimer: (weekIndex: number, taskIndex: number, taskTitle: string) => Promise<boolean>;
  completeTaskTimer: () => Promise<{ success: boolean; timeSpent: number }>;
  pauseTaskTimer: () => Promise<boolean>;
  isTaskActive: (weekIndex: number, taskIndex: number) => boolean;
  getTaskStatus: (weekIndex: number, taskIndex: number) => 'idle' | 'doing' | 'done';
  // Phase 7.7: New functions
  acknowledgeRecovery: () => void;
  clearSaveError: () => void;
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
  const [isRecoveredSession, setIsRecoveredSession] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timer state from local storage and plan data
  useEffect(() => {
    if (!planData) return;

    // Check for active task in plan data
    const activeTask = findActiveTask(planData);
    
    if (activeTask) {
      // Check if timer is stale (more than 24 hours)
      if (isTimerStale(activeTask.task.execution_started_at)) {
        // Auto-pause stale timers
        console.log('Stale timer detected, auto-pausing...');
        return;
      }
      
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
      
      // Check if this was a recovered session
      const localTimer = getLocalActiveTimer();
      if (localTimer && wasTimerRecovered()) {
        setIsRecoveredSession(true);
      } else if (localTimer) {
        // We have a local timer that matches - mark as recovered for UI
        markTimerAsRecovered();
        setIsRecoveredSession(true);
      }
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
          setIsRecoveredSession(true);
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
      setSaveError(null);
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
            setLastSaveTime(new Date());
            setIsRecoveredSession(false);
          }
        } else if (result.error) {
          setSaveError(result.error);
          toast({
            title: "Couldn't start task",
            description: "Your progress is still safe. Please try again.",
            variant: "destructive",
          });
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
    setSaveError(null);
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
        setLastSaveTime(new Date());
        setIsRecoveredSession(false);
      } else if (result.error) {
        setSaveError(result.error);
        toast({
          title: "Couldn't save completion",
          description: "We're retrying... Your time is still being tracked.",
          variant: "destructive",
        });
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
    setSaveError(null);
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
        setLastSaveTime(new Date());
        setIsRecoveredSession(false);
      } else if (result.error) {
        setSaveError(result.error);
        toast({
          title: "Couldn't pause task",
          description: "Your progress is still safe. Please try again.",
          variant: "destructive",
        });
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

  // Phase 7.7: Acknowledge recovery (dismiss recovery banner)
  const acknowledgeRecovery = useCallback(() => {
    setIsRecoveredSession(false);
  }, []);

  // Phase 7.7: Clear save error
  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

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
    // Phase 7.7: Trust indicators
    isRecoveredSession,
    saveError,
    lastSaveTime,
    // Core functions
    startTaskTimer,
    completeTaskTimer,
    pauseTaskTimer,
    isTaskActive,
    getTaskStatus,
    // Phase 7.7: New functions
    acknowledgeRecovery,
    clearSaveError,
  };
}
