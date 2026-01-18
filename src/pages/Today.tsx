import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PrimaryTaskCard } from '@/components/PrimaryTaskCard';
import { SecondaryTaskCard } from '@/components/SecondaryTaskCard';
import { TodayTaskCard } from '@/components/TodayTaskCard';
import { MomentumFeedback } from '@/components/MomentumFeedback';
import { TodayProgressRing } from '@/components/TodayProgressRing';
import { TodayFocusCard } from '@/components/TodayFocusCard';
import { TodayContextPanel } from '@/components/TodayContextPanel';
import { TodayTaskDetailsPanel } from '@/components/TodayTaskDetailsPanel';
import { TodayReflectionStrip } from '@/components/TodayReflectionStrip';
import { BottomNav } from '@/components/BottomNav';
import { DynamicBackground } from '@/components/DynamicBackground';
import { DesktopHamburgerMenu } from '@/components/DesktopHamburgerMenu';
import { TaskEffortFeedback, storeEffortFeedback, type EffortLevel } from '@/components/TaskEffortFeedback';
import { DayClosureModal } from '@/components/DayClosureModal';
import { MissedTaskNotice } from '@/components/MissedTaskNotice';
import { ActiveTimerBanner } from '@/components/ActiveTimerBanner';
import { StartTaskModal } from '@/components/StartTaskModal';
import { PlanCompletionModal } from '@/components/PlanCompletionModal';
import { StreakBadge } from '@/components/StreakBadge';
import { DailyNudgeBanner } from '@/components/DailyNudgeBanner';
import { TodayDebugPanel } from '@/components/TodayDebugPanel';
import { getTasksScheduledForToday, type ScheduledTodayTask } from '@/lib/todayScheduledTasks';
import { formatTaskDuration } from '@/lib/taskDuration';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useMobileSettings } from '@/hooks/useMobileSettings';
import { useDesktopSettings } from '@/hooks/useDesktopSettings';
import { useExecutionTimer } from '@/hooks/useExecutionTimer';
import { playTaskCompleteSound, playDayCompleteSound } from '@/lib/celebrationSound';
import { computeDailyContext, generateFallbackExplanation } from '@/lib/dailyContextEngine';
import { getScheduledCalendarTasks } from '@/hooks/useCalendarStatus';
import { formatTotalTime } from '@/lib/executionTimer';
import { getCurrentStreak, recordTaskCompletion } from '@/lib/streakTracker';
import { Loader2, Calendar, Rocket, ChevronRight, Moon, Sparkles, Clock, Play } from 'lucide-react';
import { format, startOfDay, isBefore } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
interface PlanData {
  overview: string;
  total_weeks: number;
  weeks: {
    week: number;
    focus: string;
      tasks: {
        title: string;
        priority: 'High' | 'Medium' | 'Low';
        estimated_hours: number;
        completed?: boolean;
        completed_at?: string;
        scheduled_at?: string;
        // New explicit execution state for Today flows
        execution_state?: 'pending' | 'doing' | 'done';
        // Legacy / backward-compat fields (still present in older plans)
        execution_status?: 'idle' | 'doing' | 'done';
        execution_started_at?: string;
        time_spent_seconds?: number;
        explanation?: {
          how: string;
          why: string;
          expected_outcome: string;
        };
      }[];
  }[];

  milestones?: {
    title: string;
    week: number;
  }[];
  motivation?: string[];
  is_open_ended?: boolean;
}

// Soft, non-repetitive motivational lines
const motivationalLines = ["Let's make progress — one step today.", "Small wins build lasting momentum.", "Focus on what matters most right now.", "Progress over perfection, always.", "Today is a fresh opportunity.", "One task at a time. You've got this.", "Steady progress leads to great things.", "Show up. Start small. Keep going."];

// Get a consistent motivational line based on the day
const getMotivationalLine = (): string => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return motivationalLines[dayOfYear % motivationalLines.length];
};
const Today = () => {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [showMomentum, setShowMomentum] = useState(false);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const previousCompletedCount = useRef(-1); // -1 = uninitialized, prevents false trigger on load

  // Phase 7.5: Effort feedback and day closure
  const [effortFeedbackTask, setEffortFeedbackTask] = useState<{
    title: string;
    weekIndex: number;
    taskIndex: number;
  } | null>(null);
  const [showDayClosure, setShowDayClosure] = useState(false);
  const [effortSummary, setEffortSummary] = useState<{
    easy: number;
    okay: number;
    hard: number;
  }>({
    easy: 0,
    okay: 0,
    hard: 0
  });
  const [showMissedNotice, setShowMissedNotice] = useState(false);
  const dayClosureShownRef = useRef(false);
  const hasCompletedTaskInSession = useRef(false); // Track if user completed a task THIS session
  
  // Execution timer state
  const [showStartTaskModal, setShowStartTaskModal] = useState(false);
  const [pendingStartTask, setPendingStartTask] = useState<{
    weekIndex: number;
    taskIndex: number;
    title: string;
    estimatedHours: number;
  } | null>(null);
  const [showPlanCompletion, setShowPlanCompletion] = useState(false);
  const planCompletionShownRef = useRef(false);

  // Settings for dynamic background
  const {
    settings: mobileSettings,
    isMobile
  } = useMobileSettings();
  const {
    settings: desktopSettings,
    isDesktop,
    toggleSetting,
    updateSettings,
    resetToDefaults
  } = useDesktopSettings();
  const dynamicBackgroundEnabled = isMobile ? mobileSettings.dynamicBackground : desktopSettings.dynamicBackground;
  const backgroundPattern = isMobile ? mobileSettings.backgroundPattern : desktopSettings.backgroundPattern;
  const parallaxEnabled = isMobile ? mobileSettings.parallaxEffects : desktopSettings.parallaxEffects;

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({
    currentRoute: '/today'
  });

  // Get current date formatted
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  // Time-based greeting with user's name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';else if (hour < 17) timeGreeting = 'Good afternoon';
    const firstName = profile?.fullName?.split(' ')[0] || '';
    return firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  }, [profile?.fullName]);

  // Motivational line (consistent per day)
  const motivationalLine = useMemo(() => getMotivationalLine(), []);

  // Fetch plan data
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('plans').select('id, plan_json').eq('user_id', user.id).order('created_at', {
          ascending: false
        }).limit(1).maybeSingle();
        if (error) {
          console.error('Error fetching plan:', error);
          setLoading(false);
          return;
        }
        if (!data?.plan_json) {
          setHasNoPlan(true);
          setLoading(false);
          return;
        }
        setPlanId(data.id);
        setPlanData(data.plan_json as unknown as PlanData);
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [user]);

  // Load streak on mount
  useEffect(() => {
    setStreak(getCurrentStreak());
  }, []);

  // Redirect if no plan
  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/reset', {
        replace: true
      });
    }
  }, [loading, hasNoPlan, navigate]);

  // Initialize execution timer hook
  const executionTimer = useExecutionTimer({
    planData,
    planId,
    onPlanUpdate: (updatedPlan) => setPlanData(updatedPlan),
  });

  type ExecutionState = 'pending' | 'doing' | 'done';

  const getExecutionState = useCallback((task: any): ExecutionState => {
    const s = task?.execution_state;

    // Source of truth: explicit execution_state
    if (s === 'pending' || s === 'doing' || s === 'done') {
      return s;
    }

    // Backward compat: ONLY honor legacy `completed` boolean.
    // We intentionally ignore legacy `execution_status` because stale values have been
    // causing tasks to appear "done" on page load.
    return task?.completed ? 'done' : 'pending';
  }, []);

  // Get tasks scheduled for today
  const todaysTasks: ScheduledTodayTask[] = planData ? getTasksScheduledForToday(planData) : [];
  const completedCount = todaysTasks.filter(t => getExecutionState(t.task) === 'done').length;
  const allCompleted = todaysTasks.length > 0 && completedCount === todaysTasks.length;

  // Compute daily context using the context engine
  const scheduledTasks = useMemo(() => getScheduledCalendarTasks(), []);
  const dailyContext = useMemo(() => computeDailyContext(planData, todaysTasks.length, scheduledTasks), [planData, todaysTasks.length, scheduledTasks]);

  // Phase 7.5: Count missed/rolled-forward tasks (scheduled before today but not completed)
  const missedTaskCount = useMemo(() => {
    const today = startOfDay(new Date());
    let count = 0;
    for (const scheduled of scheduledTasks) {
      const {
        weekNumber,
        taskIndex,
        scheduledAt
      } = scheduled;
      const weekIndex = weekNumber - 1;
      if (!planData?.weeks || weekIndex < 0 || weekIndex >= planData.weeks.length) continue;
      const week = planData.weeks[weekIndex];
      if (!week?.tasks || taskIndex < 0 || taskIndex >= week.tasks.length) continue;
      const task = week.tasks[taskIndex];
      if (task.completed) continue;
      try {
        const scheduledDate = startOfDay(new Date(scheduledAt));
        if (isBefore(scheduledDate, today)) {
          count++;
        }
      } catch {
        continue;
      }
    }
    return count;
  }, [scheduledTasks, planData]);

  // Show missed notice on mount if there are missed tasks
  useEffect(() => {
    if (missedTaskCount > 0 && !showMissedNotice) {
      setShowMissedNotice(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowMissedNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [missedTaskCount]);

  // Get the first not-done task as primary
  const incompleteTasks = todaysTasks.filter(t => getExecutionState(t.task) !== 'done');

  // Smart task highlighting: only focusCount tasks are emphasized
  const focusedTasks = incompleteTasks.slice(0, dailyContext.focusCount);
  const mutedTasks = incompleteTasks.slice(dailyContext.focusCount);
  const primaryTask = focusedTasks[0];
  const secondaryTasks = focusedTasks.slice(1);
  const completedTasks = todaysTasks.filter(t => getExecutionState(t.task) === 'done');

  // Get selected task for details panel (desktop)
  const selectedTask = useMemo(() => {
    if (!selectedTaskKey) return null;
    const found = todaysTasks.find(t => `${t.weekIndex}-${t.taskIndex}` === selectedTaskKey);
    if (!found) return null;
    return {
      task: found.task,
      weekNumber: found.weekIndex + 1,
      weekFocus: found.weekFocus
    };
  }, [selectedTaskKey, todaysTasks]);

  // Auto-select primary task on desktop if nothing selected
  useEffect(() => {
    if (primaryTask && !selectedTaskKey) {
      setSelectedTaskKey(`${primaryTask.weekIndex}-${primaryTask.taskIndex}`);
    }
  }, [primaryTask, selectedTaskKey]);

  const completionFeedbackTokenRef = useRef<number | null>(null);

  // Run completion feedback ONLY after user-triggered completions (never on mount)
  useEffect(() => {
    if (!planData) return;
    if (completionFeedbackTokenRef.current === null) return;

    completionFeedbackTokenRef.current = null;

    const todays = getTasksScheduledForToday(planData);
    const doneCount = todays.filter(t => getExecutionState(t.task) === 'done').length;

    setShowMomentum(true);

    if (todays.length > 0 && doneCount === todays.length) {
      playDayCompleteSound();
      if (!dayClosureShownRef.current) {
        dayClosureShownRef.current = true;
        setTimeout(() => setShowDayClosure(true), 2000);
      }

      // Plan completion modal is global; also gate it to post-completion only
      if (executionTimer.allTasksCompleted && !planCompletionShownRef.current) {
        planCompletionShownRef.current = true;
        setShowPlanCompletion(true);
      }
    } else if (doneCount > 0) {
      playTaskCompleteSound();
    }

    const timer = setTimeout(() => setShowMomentum(false), 4000);
    return () => clearTimeout(timer);
  }, [planData, executionTimer.allTasksCompleted, getExecutionState]);

  // Complete a task - with effort feedback (DEFENSIVE: only allow DOING -> DONE)
  const handleCompleteTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!planData || !planId) return;

    const updatedPlan = {
      ...planData
    };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];

    // Hard guard: pending tasks cannot be completed
    if (getExecutionState(task) !== 'doing') {
      console.warn('[Today] Prohibited completion: task is not doing', { weekIndex, taskIndex, state: getExecutionState(task) });
      return;
    }

    const taskKey = `${weekIndex}-${taskIndex}`;
    setCompletingTask(taskKey);

    // Find the scheduled time for this task
    const scheduledTask = todaysTasks.find(t => t.weekIndex === weekIndex && t.taskIndex === taskIndex);

    // Mark as done
    (task as any).execution_state = 'done';
    (task as any).execution_status = 'done'; // legacy
    task.completed = true; // legacy
    task.completed_at = new Date().toISOString();

    // Store scheduled_at for duration tracking
    if (scheduledTask?.scheduledAt) {
      (task as any).scheduled_at = scheduledTask.scheduledAt;
    }

    setPlanData({ ...updatedPlan });

    try {
      await supabase.from('plans').update({
        plan_json: updatedPlan as unknown as Json
      }).eq('id', planId);

      // Mark that user completed a task and trigger feedback after state is persisted
      hasCompletedTaskInSession.current = true;
      completionFeedbackTokenRef.current = Date.now();

      // Show effort feedback after successful completion
      setEffortFeedbackTask({
        title: task.title,
        weekIndex,
        taskIndex
      });
    } catch (err) {
      console.error('Error completing task:', err);
      // Revert on error
      (task as any).execution_state = 'pending';
      (task as any).execution_status = 'idle';
      task.completed = false;
      task.completed_at = undefined;
      (task as any).scheduled_at = undefined;
      setPlanData({
        ...planData
      });
    } finally {
      setCompletingTask(null);
    }
  }, [planData, planId, todaysTasks, getExecutionState]);

  // Handle effort feedback submission
  const handleEffortSubmit = useCallback((effort: EffortLevel) => {
    if (effortFeedbackTask) {
      storeEffortFeedback(effortFeedbackTask.weekIndex, effortFeedbackTask.taskIndex, effort);
      setEffortSummary(prev => ({
        ...prev,
        [effort]: prev[effort] + 1
      }));
    }
    setEffortFeedbackTask(null);
  }, [effortFeedbackTask]);
  const handleEffortSkip = useCallback(() => {
    setEffortFeedbackTask(null);
  }, []);

  // Execution timer handlers
  const handleStartTaskClick = useCallback((weekIndex: number, taskIndex: number, title: string, estimatedHours: number) => {
    setPendingStartTask({ weekIndex, taskIndex, title, estimatedHours });
    setShowStartTaskModal(true);
  }, []);

  const handleConfirmStartTask = useCallback(async () => {
    if (!pendingStartTask) return;
    const success = await executionTimer.startTaskTimer(
      pendingStartTask.weekIndex,
      pendingStartTask.taskIndex,
      pendingStartTask.title
    );
    if (success) {
      setShowStartTaskModal(false);
      setPendingStartTask(null);
    }
  }, [pendingStartTask, executionTimer]);

  const handleTimerComplete = useCallback(async () => {
    const result = await executionTimer.completeTaskTimer();

    if (result.success) {
      hasCompletedTaskInSession.current = true;
      completionFeedbackTokenRef.current = Date.now();
    }

    if (result.success && executionTimer.activeTimer) {
      // Show effort feedback
      setEffortFeedbackTask({
        title: executionTimer.activeTimer.taskTitle,
        weekIndex: executionTimer.activeTimer.weekIndex,
        taskIndex: executionTimer.activeTimer.taskIndex,
      });
    }
  }, [executionTimer]);

  // NOTE: Plan/day completion checks are intentionally NOT run on mount.
  // They are triggered only after user actions via completionFeedbackTokenRef.
  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-20 sm:pb-0 relative" {...swipeHandlers.handlers}>
      {/* Dynamic time-based background illustrations */}
      <DynamicBackground enabled={dynamicBackgroundEnabled} pattern={backgroundPattern} parallaxEnabled={parallaxEnabled} deviceMotionEnabled={mobileSettings.deviceMotion} />
      
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/30 relative">
        <div className="max-w-[1280px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Desktop Hamburger Menu */}
            <DesktopHamburgerMenu settings={desktopSettings} onToggle={toggleSetting} onUpdateSettings={updateSettings} onReset={resetToDefaults} />
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center lg:hidden">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm lg:hidden">Kaamyab</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Full Plan button - mobile/tablet only */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/plan')} className="text-muted-foreground hover:text-foreground h-9 px-3 lg:hidden">
              <Calendar className="w-4 h-4 mr-1.5" />
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="max-w-lg lg:max-w-[1280px] mx-auto px-5 py-6 sm:py-8 opacity-95">
        {/* Greeting Section with Progress Ring - Full width on desktop */}
        <motion.div className="mb-6" initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3
      }}>
          <div className="flex items-start justify-between gap-4">
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {greeting}
                </h1>
                <StreakBadge streak={streak} variant="default" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {motivationalLine}
              </p>
              <p className="text-xs text-muted-foreground/70">{todayFormatted}</p>
            </div>
            
            {/* Progress Ring - only show if there are tasks */}
            {todaysTasks.length > 0 && <TodayProgressRing completed={completedCount} total={todaysTasks.length} />}
          </div>
        </motion.div>

        {/* Phase 7.5: Missed Task Notice - gentle rollforward message */}
        <MissedTaskNotice missedCount={missedTaskCount} show={showMissedNotice} className="mb-4" />

        {/* Today Focus Card - Context-aware summary (mobile/tablet only) */}
        <div className="lg:hidden">
          {todaysTasks.length > 0 && !allCompleted && <TodayFocusCard context={dailyContext} />}
        </div>

        {/* Momentum Feedback */}
        <MomentumFeedback completedCount={completedCount} totalCount={todaysTasks.length} show={showMomentum} />

        {/* Desktop 3-Column Layout (simplified for burnout-risk) */}
        <div className={cn("hidden lg:grid lg:gap-6", dailyContext.signalState === 'burnout-risk' ? "lg:grid-cols-[1fr_280px]" : "lg:grid-cols-[1fr_minmax(320px,400px)_280px]")}>
          {/* LEFT COLUMN - Focus Tasks */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {allCompleted ? (/* Desktop Completion State */
            <motion.div key="completed-desktop" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="rounded-2xl border border-border/30 bg-card/50 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Moon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    You're done for today.
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    All tasks complete. Rest up.
                  </p>
                  {completedTasks.length > 0 && <div className="text-left mt-6 space-y-2">
                      {completedTasks.map(item => <div key={`${item.weekIndex}-${item.taskIndex}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 text-muted-foreground text-sm">
                          <span className="w-3 h-3 rounded-full bg-primary/30 shrink-0" />
                          <span className="line-through truncate">{item.task.title}</span>
                        </div>)}
                    </div>}
                </motion.div>) : todaysTasks.length === 0 ? (/* Desktop Empty State */
            <motion.div key="empty-desktop" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="rounded-2xl border border-dashed border-border/40 bg-muted/10 p-8 text-center opacity-80">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 mx-auto">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    You've created breathing room today.
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Schedule tasks from your plan to see them here.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/plan')} size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Full Plan
                  </Button>
                </motion.div>) : (/* Desktop Active Tasks */
            <motion.div key="tasks-desktop" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="space-y-3">
                  {focusedTasks.map((item, index) => {
                    const status = executionTimer.activeTimer?.weekIndex === item.weekIndex && executionTimer.activeTimer?.taskIndex === item.taskIndex
                      ? 'doing'
                      : getExecutionState(item.task);

                    return (
                      <TodayTaskCard
                        key={`${item.weekIndex}-${item.taskIndex}`}
                        task={item.task}
                        weekNumber={item.weekIndex + 1}
                        weekFocus={item.weekFocus}
                        onComplete={() => handleCompleteTask(item.weekIndex, item.taskIndex)}
                        isCompleting={completingTask === `${item.weekIndex}-${item.taskIndex}`}
                        isPrimary={index === 0}
                        onSelect={() => setSelectedTaskKey(`${item.weekIndex}-${item.taskIndex}`)}
                        isSelected={selectedTaskKey === `${item.weekIndex}-${item.taskIndex}`}
                        showExpandable={false}
                        fallbackExplanation={generateFallbackExplanation(item.task.title)}
                        onStartTask={() => handleStartTaskClick(item.weekIndex, item.taskIndex, item.task.title, item.task.estimated_hours)}
                        executionStatus={status as any}
                        elapsedSeconds={executionTimer.activeTimer?.weekIndex === item.weekIndex && executionTimer.activeTimer?.taskIndex === item.taskIndex ? executionTimer.elapsedSeconds : 0}
                      />
                    );
                  })}
                  
                  {/* Muted Tasks */}
                  {mutedTasks.length > 0 && <div className="space-y-2 pt-4 opacity-60">
                      <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                        Later today
                      </p>
                      {mutedTasks.map(item => <div key={`muted-${item.weekIndex}-${item.taskIndex}`} onClick={() => setSelectedTaskKey(`${item.weekIndex}-${item.taskIndex}`)} className={cn("flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors", selectedTaskKey === `${item.weekIndex}-${item.taskIndex}` && "ring-1 ring-primary/30")}>
                          <span className="text-sm truncate">{item.task.title}</span>
                          <span className="text-xs text-muted-foreground/50 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {item.task.estimated_hours <= 0.5 ? '~30m' : `~${item.task.estimated_hours}h`}
                          </span>
                        </div>)}
                    </div>}
                  
                  {/* Completed summary */}
                  {completedTasks.length > 0 && <div className="pt-4 border-t border-border/10">
                      <p className="text-xs text-muted-foreground/50 mb-2">
                        ✓ {completedTasks.length} done today
                      </p>
                    </div>}
                </motion.div>)}
            </AnimatePresence>
          </div>
          
          {/* CENTER COLUMN - Task Details (collapsed in burnout-risk) */}
          {dailyContext.signalState !== 'burnout-risk' && <TodayTaskDetailsPanel selectedTask={selectedTask} dayType={dailyContext.dayType} />}
          
          {/* RIGHT COLUMN - Context Panel (collapsed in burnout-risk) */}
          <TodayContextPanel context={dailyContext} collapsed={dailyContext.signalState === 'burnout-risk'} />
        </div>
        
        {/* Desktop Reflection Strip */}
        <div className="hidden lg:block mt-6">
          <TodayReflectionStrip signalState={dailyContext.signalState} />
        </div>

        {/* Mobile/Tablet Task Display - Original Layout */}
        <div className="lg:hidden">
          <AnimatePresence mode="wait">
            {allCompleted ? (/* Completion State - Day is done */
          <motion.div key="completed" initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} exit={{
            opacity: 0,
            scale: 0.95
          }} transition={{
            duration: 0.3
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Moon className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  You're done for today.
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mb-8">
                  All tasks complete. Rest up — tomorrow brings new focus.
                </p>
                
                {/* Completed tasks summary - collapsed */}
                {completedTasks.length > 0 && <div className="w-full text-left mb-6">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3 text-center">
                      Completed today
                    </p>
                    <div className="space-y-2">
                      {completedTasks.map(item => {
                  const duration = item.scheduledAt && item.task.completed_at ? formatTaskDuration(item.scheduledAt, item.task.completed_at) : null;
                  return <div key={`${item.weekIndex}-${item.taskIndex}`} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/30 text-muted-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              </span>
                              <span className="text-sm line-through truncate">{item.task.title}</span>
                            </div>
                            {duration && <span className="text-xs text-muted-foreground/60 shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {duration}
                              </span>}
                          </div>;
                })}
                    </div>
                  </div>}
                
                <Button variant="outline" onClick={() => navigate('/plan')} className="touch-press">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Plan
                </Button>
              </motion.div>) : todaysTasks.length === 0 ? (/* No Tasks Scheduled for Today */
          <motion.div key="empty" initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} exit={{
            opacity: 0,
            scale: 0.95
          }} transition={{
            duration: 0.3
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  You're clear for today.
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                  Enjoy the momentum. Schedule tasks from your plan to see them here.
                </p>
                <Button variant="outline" onClick={() => navigate('/plan')} className="touch-press">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Plan
                </Button>
              </motion.div>) : (/* Active Tasks - Mobile */
          <motion.div key="tasks" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.2
          }} className="space-y-5">
                {primaryTask && (
                  <PrimaryTaskCard
                    task={primaryTask.task}
                    weekNumber={primaryTask.weekIndex + 1}
                    weekFocus={primaryTask.weekFocus}
                    onComplete={() => handleCompleteTask(primaryTask.weekIndex, primaryTask.taskIndex)}
                    isCompleting={completingTask === `${primaryTask.weekIndex}-${primaryTask.taskIndex}`}
                    isScheduled={true}
                    fallbackExplanation={generateFallbackExplanation(primaryTask.task.title)}
                    onStartTask={() => handleStartTaskClick(primaryTask.weekIndex, primaryTask.taskIndex, primaryTask.task.title, primaryTask.task.estimated_hours)}
                    executionStatus={(executionTimer.activeTimer?.weekIndex === primaryTask.weekIndex && executionTimer.activeTimer?.taskIndex === primaryTask.taskIndex ? 'doing' : getExecutionState(primaryTask.task)) as any}
                    elapsedSeconds={executionTimer.activeTimer?.weekIndex === primaryTask.weekIndex && executionTimer.activeTimer?.taskIndex === primaryTask.taskIndex ? executionTimer.elapsedSeconds : 0}
                  />
                )}

                {/* Secondary Tasks - Smaller, less prominent */}
                {secondaryTasks.length > 0 && <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                      Also on your plate
                    </p>
                    {secondaryTasks.map((item, index) => <motion.div key={`${item.weekIndex}-${item.taskIndex}`} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.3,
                delay: 0.1 + index * 0.05
              }}>
                        <SecondaryTaskCard
                          task={item.task}
                          weekNumber={item.weekIndex + 1}
                          weekFocus={item.weekFocus}
                          onComplete={() => handleCompleteTask(item.weekIndex, item.taskIndex)}
                          isCompleting={completingTask === `${item.weekIndex}-${item.taskIndex}`}
                          taskNumber={index + 2}
                          isScheduled={true}
                          fallbackExplanation={generateFallbackExplanation(item.task.title)}
                          onStartTask={() => handleStartTaskClick(item.weekIndex, item.taskIndex, item.task.title, item.task.estimated_hours)}
                          executionStatus={(executionTimer.activeTimer?.weekIndex === item.weekIndex && executionTimer.activeTimer?.taskIndex === item.taskIndex ? 'doing' : getExecutionState(item.task)) as any}
                          elapsedSeconds={executionTimer.activeTimer?.weekIndex === item.weekIndex && executionTimer.activeTimer?.taskIndex === item.taskIndex ? executionTimer.elapsedSeconds : 0}
                        />
                      </motion.div>)}
                  </div>}

                {/* Muted Tasks - Visible but de-emphasized */}
                {mutedTasks.length > 0 && <div className="space-y-2 pt-4 opacity-50">
                    <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                      Later today
                    </p>
                    {mutedTasks.map(item => <div key={`muted-${item.weekIndex}-${item.taskIndex}`} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/20 text-muted-foreground">
                        <span className="text-sm truncate">{item.task.title}</span>
                        <span className="text-xs text-muted-foreground/50 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {item.task.estimated_hours <= 0.5 ? '~30m' : `~${item.task.estimated_hours}h`}
                        </span>
                      </div>)}
                  </div>}

                {/* Completed Tasks - Subtle list */}
                {completedTasks.length > 0 && <div className="pt-4 border-t border-border/10">
                    <p className="text-xs text-muted-foreground/50 mb-2">
                      ✓ {completedTasks.length} done today
                    </p>
                  </div>}
              </motion.div>)}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Dev-only debug panel */}
      {import.meta.env.DEV && (
        <div className="max-w-lg lg:max-w-[1280px] mx-auto px-5">
          <TodayDebugPanel
            data={{
              loading,
              planId,
              todaysTasks: todaysTasks.map(t => ({
                key: `${t.weekIndex}-${t.taskIndex}`,
                title: t.task.title,
                scheduledAt: t.scheduledAt,
                derived_execution_state: getExecutionState(t.task),
                execution_state: (t.task as any).execution_state,
                execution_status: (t.task as any).execution_status,
                completed: (t.task as any).completed,
                completed_at: (t.task as any).completed_at,
                legacy_done_without_completed:
                  !(t.task as any).execution_state && (t.task as any).execution_status === 'done' && !(t.task as any).completed,
              })),
              completedCount,
              allCompleted,
              hasCompletedTaskInSession: hasCompletedTaskInSession.current,
              activeTimer: executionTimer.activeTimer,
            }}
          />
        </div>
      )}

      <BottomNav />
      
      {/* Active Timer Banner - Fixed at bottom when task is active */}
      {executionTimer.activeTimer && (
        <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
          <ActiveTimerBanner
            taskTitle={executionTimer.activeTimer.taskTitle}
            elapsedSeconds={executionTimer.elapsedSeconds}
            onComplete={handleTimerComplete}
            onPause={executionTimer.pauseTaskTimer}
            isCompleting={executionTimer.isCompleting}
            isPausing={executionTimer.isPausing}
            variant="prominent"
          />
        </div>
      )}
      
      {/* Start Task Modal */}
      <StartTaskModal
        open={showStartTaskModal}
        onOpenChange={setShowStartTaskModal}
        taskTitle={pendingStartTask?.title || ''}
        estimatedHours={pendingStartTask?.estimatedHours || 1}
        onStart={handleConfirmStartTask}
        isStarting={executionTimer.isStarting}
      />
      
      {/* Phase 7.5: Effort Feedback Modal */}
      <TaskEffortFeedback taskTitle={effortFeedbackTask?.title || ''} onSubmit={handleEffortSubmit} onSkip={handleEffortSkip} open={effortFeedbackTask !== null} />
      
      {/* Phase 7.5: Day Closure Modal */}
      <DayClosureModal open={showDayClosure} onClose={() => setShowDayClosure(false)} completedCount={completedCount} effortSummary={effortSummary} />
      
      {/* Plan Completion Modal */}
      <PlanCompletionModal
        open={showPlanCompletion}
        onOpenChange={setShowPlanCompletion}
        totalTimeSpentSeconds={executionTimer.totalTimeSpent}
        totalTasks={planData?.weeks?.reduce((acc, w) => acc + w.tasks.length, 0) || 0}
      />
    </div>;
};
export default Today;