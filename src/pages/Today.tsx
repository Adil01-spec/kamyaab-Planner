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
import { getTasksScheduledForToday, type ScheduledTodayTask } from '@/lib/todayScheduledTasks';
import { formatTaskDuration } from '@/lib/taskDuration';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useMobileSettings } from '@/hooks/useMobileSettings';
import { useDesktopSettings } from '@/hooks/useDesktopSettings';
import { playTaskCompleteSound, playDayCompleteSound } from '@/lib/celebrationSound';
import { computeDailyContext, generateFallbackExplanation } from '@/lib/dailyContextEngine';
import { getScheduledCalendarTasks } from '@/hooks/useCalendarStatus';
import { 
  Loader2, 
  Calendar,
  Rocket,
  ChevronRight,
  Moon,
  Sparkles,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
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
      explanation?: {
        how: string;
        why: string;
        expected_outcome: string;
      };
    }[];
  }[];
  milestones?: { title: string; week: number }[];
  motivation?: string[];
  is_open_ended?: boolean;
}

// Soft, non-repetitive motivational lines
const motivationalLines = [
  "Let's make progress — one step today.",
  "Small wins build lasting momentum.",
  "Focus on what matters most right now.",
  "Progress over perfection, always.",
  "Today is a fresh opportunity.",
  "One task at a time. You've got this.",
  "Steady progress leads to great things.",
  "Show up. Start small. Keep going.",
];

// Get a consistent motivational line based on the day
const getMotivationalLine = (): string => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return motivationalLines[dayOfYear % motivationalLines.length];
};

const Today = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [showMomentum, setShowMomentum] = useState(false);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const previousCompletedCount = useRef(0);

  // Settings for dynamic background
  const { settings: mobileSettings, isMobile } = useMobileSettings();
  const { settings: desktopSettings, isDesktop, toggleSetting, updateSettings, resetToDefaults } = useDesktopSettings();
  const dynamicBackgroundEnabled = isMobile ? mobileSettings.dynamicBackground : desktopSettings.dynamicBackground;
  const backgroundPattern = isMobile ? mobileSettings.backgroundPattern : desktopSettings.backgroundPattern;
  const parallaxEnabled = isMobile ? mobileSettings.parallaxEffects : desktopSettings.parallaxEffects;

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({ currentRoute: '/today' });

  // Get current date formatted
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  // Time-based greeting with user's name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    
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
        const { data, error } = await supabase
          .from('plans')
          .select('id, plan_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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

  // Redirect if no plan
  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/reset', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  // Get tasks scheduled for today
  const todaysTasks: ScheduledTodayTask[] = planData ? getTasksScheduledForToday(planData) : [];
  const completedCount = todaysTasks.filter(t => t.task.completed).length;
  const allCompleted = todaysTasks.length > 0 && completedCount === todaysTasks.length;
  
  // Compute daily context using the context engine
  const scheduledTasks = useMemo(() => getScheduledCalendarTasks(), []);
  const dailyContext = useMemo(() => 
    computeDailyContext(planData, todaysTasks.length, scheduledTasks),
    [planData, todaysTasks.length, scheduledTasks]
  );
  
  // Get the first incomplete task as primary
  const incompleteTasks = todaysTasks.filter(t => !t.task.completed);
  
  // Smart task highlighting: only focusCount tasks are emphasized
  const focusedTasks = incompleteTasks.slice(0, dailyContext.focusCount);
  const mutedTasks = incompleteTasks.slice(dailyContext.focusCount);
  
  const primaryTask = focusedTasks[0];
  const secondaryTasks = focusedTasks.slice(1);
  const completedTasks = todaysTasks.filter(t => t.task.completed);
  
  // Get selected task for details panel (desktop)
  const selectedTask = useMemo(() => {
    if (!selectedTaskKey) return null;
    const found = todaysTasks.find(t => `${t.weekIndex}-${t.taskIndex}` === selectedTaskKey);
    if (!found) return null;
    return {
      task: found.task,
      weekNumber: found.weekIndex + 1,
      weekFocus: found.weekFocus,
    };
  }, [selectedTaskKey, todaysTasks]);
  
  // Auto-select primary task on desktop if nothing selected
  useEffect(() => {
    if (primaryTask && !selectedTaskKey) {
      setSelectedTaskKey(`${primaryTask.weekIndex}-${primaryTask.taskIndex}`);
    }
  }, [primaryTask, selectedTaskKey]);

  // Show momentum feedback and play sound when completing a task
  useEffect(() => {
    if (completedCount > previousCompletedCount.current && previousCompletedCount.current >= 0) {
      setShowMomentum(true);
      
      // Play appropriate sound
      if (completedCount === todaysTasks.length && todaysTasks.length > 0) {
        // All tasks completed - play calm day-complete sound
        playDayCompleteSound();
      } else if (completedCount > 0) {
        // Individual task completed - play subtle pop
        playTaskCompleteSound();
      }
      
      const timer = setTimeout(() => setShowMomentum(false), 4000);
      return () => clearTimeout(timer);
    }
    previousCompletedCount.current = completedCount;
  }, [completedCount, todaysTasks.length]);

  // Complete a task
  const handleCompleteTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!planData || !planId) return;

    const taskKey = `${weekIndex}-${taskIndex}`;
    setCompletingTask(taskKey);

    const updatedPlan = { ...planData };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    
    // Find the scheduled time for this task
    const scheduledTask = todaysTasks.find(
      t => t.weekIndex === weekIndex && t.taskIndex === taskIndex
    );
    
    // Mark as completed with timestamps
    task.completed = true;
    task.completed_at = new Date().toISOString();
    
    // Store scheduled_at for duration tracking
    if (scheduledTask?.scheduledAt) {
      (task as any).scheduled_at = scheduledTask.scheduledAt;
    }

    setPlanData({ ...updatedPlan });

    try {
      await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('id', planId);
    } catch (err) {
      console.error('Error completing task:', err);
      // Revert on error
      task.completed = false;
      task.completed_at = undefined;
      (task as any).scheduled_at = undefined;
      setPlanData({ ...planData });
    } finally {
      setCompletingTask(null);
    }
  }, [planData, planId, todaysTasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background pb-20 sm:pb-0 relative"
      {...swipeHandlers.handlers}
    >
      {/* Dynamic time-based background illustrations */}
      <DynamicBackground 
        enabled={dynamicBackgroundEnabled} 
        pattern={backgroundPattern}
        parallaxEnabled={parallaxEnabled}
        deviceMotionEnabled={mobileSettings.deviceMotion}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/30 relative">
        <div className="max-w-[1280px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Desktop Hamburger Menu */}
            <DesktopHamburgerMenu
              settings={desktopSettings}
              onToggle={toggleSetting}
              onUpdateSettings={updateSettings}
              onReset={resetToDefaults}
            />
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center lg:hidden">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm lg:hidden">Kaamyab</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Full Plan button - mobile/tablet only */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/plan')}
              className="text-muted-foreground hover:text-foreground h-9 px-3 lg:hidden"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="max-w-lg lg:max-w-[1280px] mx-auto px-5 py-6 sm:py-8">
        {/* Greeting Section with Progress Ring - Full width on desktop */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
                {greeting}
              </h1>
              <p className="text-sm text-muted-foreground mb-2">
                {motivationalLine}
              </p>
              <p className="text-xs text-muted-foreground/70">{todayFormatted}</p>
            </div>
            
            {/* Progress Ring - only show if there are tasks */}
            {todaysTasks.length > 0 && (
              <TodayProgressRing 
                completed={completedCount} 
                total={todaysTasks.length} 
              />
            )}
          </div>
        </motion.div>

        {/* Today Focus Card - Context-aware summary (mobile/tablet only) */}
        <div className="lg:hidden">
          {todaysTasks.length > 0 && !allCompleted && (
            <TodayFocusCard context={dailyContext} />
          )}
        </div>

        {/* Momentum Feedback */}
        <MomentumFeedback 
          completedCount={completedCount}
          totalCount={todaysTasks.length}
          show={showMomentum}
        />

        {/* Desktop 3-Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_minmax(320px,400px)_280px] lg:gap-6">
          {/* LEFT COLUMN - Focus Tasks */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {allCompleted ? (
                /* Desktop Completion State */
                <motion.div
                  key="completed-desktop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border/30 bg-card/50 p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <Moon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    You're done for today.
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    All tasks complete. Rest up.
                  </p>
                  {completedTasks.length > 0 && (
                    <div className="text-left mt-6 space-y-2">
                      {completedTasks.map((item) => (
                        <div 
                          key={`${item.weekIndex}-${item.taskIndex}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 text-muted-foreground text-sm"
                        >
                          <span className="w-3 h-3 rounded-full bg-primary/30 shrink-0" />
                          <span className="line-through truncate">{item.task.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : todaysTasks.length === 0 ? (
                /* Desktop Empty State */
                <motion.div
                  key="empty-desktop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-border/40 bg-muted/10 p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 mx-auto">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    You've created breathing room today.
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Schedule tasks from your plan to see them here.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/plan')}
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Full Plan
                  </Button>
                </motion.div>
              ) : (
                /* Desktop Active Tasks */
                <motion.div
                  key="tasks-desktop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {/* All focused tasks using TodayTaskCard */}
                  {focusedTasks.map((item, index) => (
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
                    />
                  ))}
                  
                  {/* Muted Tasks */}
                  {mutedTasks.length > 0 && (
                    <div className="space-y-2 pt-4 opacity-60">
                      <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                        Later today
                      </p>
                      {mutedTasks.map((item) => (
                        <div
                          key={`muted-${item.weekIndex}-${item.taskIndex}`}
                          onClick={() => setSelectedTaskKey(`${item.weekIndex}-${item.taskIndex}`)}
                          className={cn(
                            "flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors",
                            selectedTaskKey === `${item.weekIndex}-${item.taskIndex}` && "ring-1 ring-primary/30"
                          )}
                        >
                          <span className="text-sm truncate">{item.task.title}</span>
                          <span className="text-xs text-muted-foreground/50 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {item.task.estimated_hours <= 0.5 ? '~30m' : `~${item.task.estimated_hours}h`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Completed summary */}
                  {completedTasks.length > 0 && (
                    <div className="pt-4 border-t border-border/10">
                      <p className="text-xs text-muted-foreground/50 mb-2">
                        ✓ {completedTasks.length} done today
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* CENTER COLUMN - Task Details */}
          <TodayTaskDetailsPanel 
            selectedTask={selectedTask} 
            dayType={dailyContext.dayType}
          />
          
          {/* RIGHT COLUMN - Context Panel */}
          <TodayContextPanel context={dailyContext} />
        </div>
        
        {/* Desktop Reflection Strip */}
        <div className="hidden lg:block mt-6">
          <TodayReflectionStrip />
        </div>

        {/* Mobile/Tablet Task Display - Original Layout */}
        <div className="lg:hidden">
          <AnimatePresence mode="wait">
            {allCompleted ? (
              /* Completion State - Day is done */
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
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
                {completedTasks.length > 0 && (
                  <div className="w-full text-left mb-6">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3 text-center">
                      Completed today
                    </p>
                    <div className="space-y-2">
                      {completedTasks.map((item) => {
                        const duration = item.scheduledAt && item.task.completed_at
                          ? formatTaskDuration(item.scheduledAt, item.task.completed_at)
                          : null;

                        return (
                          <div 
                            key={`${item.weekIndex}-${item.taskIndex}`}
                            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/30 text-muted-foreground"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              </span>
                              <span className="text-sm line-through truncate">{item.task.title}</span>
                            </div>
                            {duration && (
                              <span className="text-xs text-muted-foreground/60 shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {duration}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/plan')}
                  className="touch-press"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Plan
                </Button>
              </motion.div>
            ) : todaysTasks.length === 0 ? (
              /* No Tasks Scheduled for Today */
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  You're clear for today.
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mb-6">
                  Enjoy the momentum. Schedule tasks from your plan to see them here.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/plan')}
                  className="touch-press"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Plan
                </Button>
              </motion.div>
            ) : (
              /* Active Tasks - Mobile */
              <motion.div
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Primary Task - First incomplete task gets emphasis */}
                {primaryTask && (
                  <PrimaryTaskCard
                    task={primaryTask.task}
                    weekNumber={primaryTask.weekIndex + 1}
                    weekFocus={primaryTask.weekFocus}
                    onComplete={() => handleCompleteTask(primaryTask.weekIndex, primaryTask.taskIndex)}
                    isCompleting={completingTask === `${primaryTask.weekIndex}-${primaryTask.taskIndex}`}
                    isScheduled={true}
                    fallbackExplanation={generateFallbackExplanation(primaryTask.task.title)}
                  />
                )}

                {/* Secondary Tasks - Smaller, less prominent */}
                {secondaryTasks.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
                      Also on your plate
                    </p>
                    {secondaryTasks.map((item, index) => (
                      <motion.div
                        key={`${item.weekIndex}-${item.taskIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                      >
                        <SecondaryTaskCard
                          task={item.task}
                          weekNumber={item.weekIndex + 1}
                          weekFocus={item.weekFocus}
                          onComplete={() => handleCompleteTask(item.weekIndex, item.taskIndex)}
                          isCompleting={completingTask === `${item.weekIndex}-${item.taskIndex}`}
                          taskNumber={index + 2}
                          isScheduled={true}
                          fallbackExplanation={generateFallbackExplanation(item.task.title)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Muted Tasks - Visible but de-emphasized */}
                {mutedTasks.length > 0 && (
                  <div className="space-y-2 pt-4 opacity-50">
                    <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">
                      Later today
                    </p>
                    {mutedTasks.map((item) => (
                      <div
                        key={`muted-${item.weekIndex}-${item.taskIndex}`}
                        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-muted/20 text-muted-foreground"
                      >
                        <span className="text-sm truncate">{item.task.title}</span>
                        <span className="text-xs text-muted-foreground/50 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {item.task.estimated_hours <= 0.5 ? '~30m' : `~${item.task.estimated_hours}h`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed Tasks - Subtle list */}
                {completedTasks.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <p className="text-xs text-muted-foreground/50 mb-2">
                      ✓ {completedTasks.length} done today
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Today;
