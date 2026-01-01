import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TodayTaskCard } from '@/components/TodayTaskCard';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getTodaysTasks, type TodayTask } from '@/lib/todayTaskSelector';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { 
  Loader2, 
  PartyPopper, 
  Calendar,
  Rocket,
  ChevronRight,
  Home
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

const Today = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({ currentRoute: '/today' });

  // Get current date formatted
  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  // Time-based greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  // Get today's tasks using the selector
  const todaysTasks: TodayTask[] = planData ? getTodaysTasks(planData) : [];
  const allCompleted = todaysTasks.length > 0 && todaysTasks.every(t => t.task.completed);

  // Complete a task
  const handleCompleteTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!planData || !planId) return;

    const taskKey = `${weekIndex}-${taskIndex}`;
    setCompletingTask(taskKey);

    const updatedPlan = { ...planData };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    
    // Mark as completed with timestamp
    task.completed = true;
    task.completed_at = new Date().toISOString();

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
      setPlanData({ ...planData });
    } finally {
      setCompletingTask(null);
    }
  }, [planData, planId]);

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
      <main className="max-w-lg mx-auto px-5 py-8">
        {/* Greeting Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-foreground mb-1">Today's Focus</h1>
          <p className="text-sm text-muted-foreground">{todayFormatted}</p>
        </motion.div>

        {/* Tasks or Completion State */}
        <AnimatePresence mode="wait">
          {allCompleted ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <PartyPopper className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You're clear today 🎉
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                Great work! All tasks for today are complete. Check back tomorrow for more.
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
          ) : todaysTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <PartyPopper className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                You're all caught up! 🎉
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">
                No pending tasks right now. Check your full plan to see what's next.
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
            <motion.div
              key="tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {todaysTasks.map((item, index) => (
                <motion.div
                  key={`${item.weekIndex}-${item.taskIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <TodayTaskCard
                    task={item.task}
                    weekNumber={item.weekIndex + 1}
                    weekFocus={item.weekFocus}
                    onComplete={() => handleCompleteTask(item.weekIndex, item.taskIndex)}
                    isCompleting={completingTask === `${item.weekIndex}-${item.taskIndex}`}
                  />
                </motion.div>
              ))}
              
              {/* Subtle indicator */}
              <p className="text-center text-xs text-muted-foreground/60 pt-4">
                {todaysTasks.length} of 3 tasks shown • Focus on one at a time
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Today;
