import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PrimaryTaskCard } from '@/components/PrimaryTaskCard';
import { SecondaryTaskCard } from '@/components/SecondaryTaskCard';
import { MomentumFeedback } from '@/components/MomentumFeedback';
import { TodayProgressRing } from '@/components/TodayProgressRing';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getTasksScheduledForToday, type ScheduledTodayTask } from '@/lib/todayScheduledTasks';
import { formatTaskDuration } from '@/lib/taskDuration';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { playTaskCompleteSound, playDayCompleteSound } from '@/lib/celebrationSound';
import { 
  Loader2, 
  Calendar,
  Rocket,
  ChevronRight,
  Home,
  Moon,
  Sparkles,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';

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
  const previousCompletedCount = useRef(0);

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
  
  // Get the first incomplete task as primary
  const incompleteTasks = todaysTasks.filter(t => !t.task.completed);
  const primaryTask = incompleteTasks[0];
  const secondaryTasks = incompleteTasks.slice(1);
  const completedTasks = todaysTasks.filter(t => t.task.completed);

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
      className="min-h-screen bg-background pb-20 sm:pb-0"
      {...swipeHandlers.handlers}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/30">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">Kaamyab</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Home button - visible on desktop */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="hidden sm:flex text-muted-foreground hover:text-foreground h-9 px-3"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Home
            </Button>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/plan')}
              className="text-muted-foreground hover:text-foreground h-9 px-3"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Full Plan</span>
              <ChevronRight className="w-4 h-4 sm:hidden" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-5 py-6 sm:py-8">
        {/* Greeting Section with Progress Ring */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
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

        {/* Momentum Feedback */}
        <MomentumFeedback 
          completedCount={completedCount}
          totalCount={todaysTasks.length}
          show={showMomentum}
        />

        {/* Task Display */}
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
                      // Calculate duration using scheduledAt from the item and completed_at from the task
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
            /* Active Tasks */
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
                      />
                    </motion.div>
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
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Today;
