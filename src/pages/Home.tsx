import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { calculatePlanProgress } from '@/lib/planProgress';
import { getCurrentStreak, recordTaskCompletion } from '@/lib/streakTracker';
import { 
  Loader2, 
  ArrowRight, 
  Leaf,
  Flame,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanData {
  overview: string;
  total_weeks: number;
  weeks: Week[];
  milestones?: { title: string; week: number }[];
  motivation?: string[];
  is_open_ended?: boolean;
  project_title?: string;
}

const Home = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [streak, setStreak] = useState(0);

  // Calculate progress from the actual plan data
  const progress = calculatePlanProgress(planData);

  // Get current active week (first week with incomplete tasks)
  const getCurrentWeekIndex = useCallback((): number => {
    if (!planData?.weeks) return 0;
    
    for (let i = 0; i < planData.weeks.length; i++) {
      const hasIncompleteTasks = planData.weeks[i].tasks.some(t => !t.completed);
      if (hasIncompleteTasks) return i;
    }
    
    return planData.weeks.length - 1;
  }, [planData]);

  // Get today's focus tasks (1-3 incomplete tasks from current week)
  const getTodaysTasks = useCallback((): { task: Task; weekIndex: number; taskIndex: number }[] => {
    if (!planData?.weeks) return [];
    
    const currentWeekIndex = getCurrentWeekIndex();
    const currentWeek = planData.weeks[currentWeekIndex];
    
    if (!currentWeek) return [];
    
    // Get incomplete tasks from current week
    const incompleteTasks = currentWeek.tasks
      .map((task, taskIndex) => ({ task, weekIndex: currentWeekIndex, taskIndex }))
      .filter(({ task }) => !task.completed)
      .slice(0, 3);
    
    // If no tasks in current week, find next incomplete task
    if (incompleteTasks.length === 0) {
      for (let i = currentWeekIndex + 1; i < planData.weeks.length; i++) {
        const week = planData.weeks[i];
        const firstIncomplete = week.tasks.findIndex(t => !t.completed);
        if (firstIncomplete !== -1) {
          return [{ task: week.tasks[firstIncomplete], weekIndex: i, taskIndex: firstIncomplete }];
        }
      }
    }
    
    return incompleteTasks;
  }, [planData, getCurrentWeekIndex]);

  useEffect(() => {
    const fetchLatestPlan = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, plan_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setHasNoPlan(true);
          }
          setLoading(false);
          return;
        }

        if (data?.plan_json) {
          setPlanId(data.id);
          const rawPlan = data.plan_json as Record<string, unknown>;
          setPlanData({
            overview: rawPlan.overview as string || '',
            total_weeks: rawPlan.total_weeks as number || 0,
            weeks: (rawPlan.weeks as PlanData['weeks']) || [],
            milestones: rawPlan.milestones as PlanData['milestones'],
            motivation: rawPlan.motivation as string[],
            is_open_ended: rawPlan.is_open_ended as boolean,
            project_title: profile?.projectTitle || ''
          });
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPlan();
  }, [user, profile?.projectTitle]);

  // Load streak on mount
  useEffect(() => {
    setStreak(getCurrentStreak());
  }, []);

  // Animate progress bar on load
  useEffect(() => {
    if (planData) {
      const timer = setTimeout(() => setProgressValue(progress.percent), 100);
      return () => clearTimeout(timer);
    }
  }, [planData, progress.percent]);

  // For users with no plan, redirect to /plan/reset
  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/reset', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  // Toggle task completion
  const toggleTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!planData || !planId) return;

    const updatedPlan = { ...planData };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;

    setPlanData(updatedPlan);

    // Update streak if completing a task (not uncompleting)
    if (!wasCompleted) {
      const newStreak = recordTaskCompletion();
      setStreak(newStreak);
    }

    // Persist to database
    try {
      await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', planId);
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert on error
      task.completed = wasCompleted;
      setPlanData({ ...planData });
    }
  }, [planData, planId]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const userInitials = profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const todaysTasks = getTodaysTasks();
  const currentWeekIndex = getCurrentWeekIndex();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 shadow-glow">
          <Leaf className="w-8 h-8 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Minimal Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-kaamyab flex items-center justify-center shadow-soft">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{streak}-day streak</span>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Today's Focus Section */}
        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Today's Focus
            </h1>
            <p className="text-muted-foreground text-sm">
              {todaysTasks.length > 0 
                ? `Week ${currentWeekIndex + 1} · ${todaysTasks.length} task${todaysTasks.length !== 1 ? 's' : ''} to complete`
                : 'All tasks completed!'
              }
            </p>
          </div>

          {todaysTasks.length > 0 ? (
            <div className="space-y-3">
              {todaysTasks.map(({ task, weekIndex, taskIndex }) => (
                <Card 
                  key={`${weekIndex}-${taskIndex}`}
                  className="glass-card rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/30"
                  onClick={() => toggleTask(weekIndex, taskIndex)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox
                      checked={task.completed || false}
                      onCheckedChange={() => toggleTask(weekIndex, taskIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-foreground leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimated_hours}h
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' 
                            ? 'bg-destructive/10 text-destructive' 
                            : task.priority === 'medium'
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card rounded-xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground">You're all caught up for today.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Active Plan Overview */}
        {planData && (
          <Card 
            className="glass-card rounded-xl animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  Active Plan
                </span>
              </div>
              <CardTitle className="text-lg">
                {planData.project_title || 'Your Project'}
              </CardTitle>
              <CardDescription className="line-clamp-1 text-sm">
                {planData.overview}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {progress.completed}/{progress.total} tasks
                  </span>
                  <span className="font-medium text-primary">{progress.percent}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              {/* Primary CTA */}
              <Button
                className="w-full gradient-kaamyab font-semibold shadow-soft btn-press"
                onClick={() => navigate('/plan')}
              >
                Continue My Plan
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Home;
