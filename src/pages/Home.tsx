import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { calculatePlanProgress } from '@/lib/planProgress';
import { getCurrentStreak, recordTaskCompletion } from '@/lib/streakTracker';
import { 
  Loader2, 
  ArrowRight, 
  Flame,
  Clock,
  Check
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

// Time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const Home = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [streak, setStreak] = useState(0);

  const progress = calculatePlanProgress(planData);

  const getCurrentWeekIndex = useCallback((): number => {
    if (!planData?.weeks) return 0;
    
    for (let i = 0; i < planData.weeks.length; i++) {
      const hasIncompleteTasks = planData.weeks[i].tasks.some(t => !t.completed);
      if (hasIncompleteTasks) return i;
    }
    
    return planData.weeks.length - 1;
  }, [planData]);

  const getTodaysTasks = useCallback((): { task: Task; weekIndex: number; taskIndex: number }[] => {
    if (!planData?.weeks) return [];
    
    const currentWeekIndex = getCurrentWeekIndex();
    const currentWeek = planData.weeks[currentWeekIndex];
    
    if (!currentWeek) return [];
    
    const incompleteTasks = currentWeek.tasks
      .map((task, taskIndex) => ({ task, weekIndex: currentWeekIndex, taskIndex }))
      .filter(({ task }) => !task.completed)
      .slice(0, 3);
    
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

  useEffect(() => {
    setStreak(getCurrentStreak());
  }, []);

  useEffect(() => {
    if (planData) {
      const timer = setTimeout(() => setProgressValue(progress.percent), 150);
      return () => clearTimeout(timer);
    }
  }, [planData, progress.percent]);

  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/reset', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  const toggleTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!planData || !planId) return;

    const updatedPlan = { ...planData };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;

    setPlanData(updatedPlan);

    if (!wasCompleted) {
      const newStreak = recordTaskCompletion();
      setStreak(newStreak);
    }

    try {
      await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', planId);
    } catch (err) {
      console.error('Error updating task:', err);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-xl mx-auto px-5 py-8">
        
        {/* ═══════════════════════════════════════════════════════════════
            ZONE 1 — Personal Context
            Soft, minimal header answering "Where am I?"
        ═══════════════════════════════════════════════════════════════ */}
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground/80 font-normal tracking-wide">
                {getGreeting()}
              </p>
              <h2 className="text-base font-medium text-foreground/90">
                {planData?.project_title || profile?.fullName || 'Your Workspace'}
              </h2>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-opacity hover:opacity-80">
                  <Avatar className="h-9 w-9 border border-border/40">
                    <AvatarFallback className="bg-muted/50 text-muted-foreground font-medium text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-card/95 backdrop-blur-xl border-border/30" align="end">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-foreground/90">{profile?.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground text-sm"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Subtle divider fade */}
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 2 — Today's Focus (Hero Section)
            Visual anchor of the Home screen
        ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-10 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
            Today's Focus
          </p>

          {todaysTasks.length > 0 ? (
            <div 
              className="relative rounded-2xl p-5 space-y-4"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid hsl(var(--border) / 0.15)',
                boxShadow: '0 4px 24px -8px hsl(var(--primary) / 0.06)'
              }}
            >
              {/* Subtle accent gradient at top */}
              <div 
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)'
                }}
              />

              {todaysTasks.map(({ task, weekIndex, taskIndex }, idx) => (
                <div
                  key={`${weekIndex}-${taskIndex}`}
                  onClick={() => toggleTask(weekIndex, taskIndex)}
                  className="group flex items-start gap-4 cursor-pointer rounded-xl p-3 -mx-2 transition-all duration-200 hover:bg-primary/[0.03]"
                  style={{
                    boxShadow: 'inset 0 0 0 1px transparent',
                    transition: 'box-shadow 0.2s ease, background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px hsl(var(--primary) / 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px transparent';
                  }}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={task.completed || false}
                      onCheckedChange={() => toggleTask(weekIndex, taskIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-[18px] w-[18px] rounded-[5px] border border-border/50 transition-all duration-150 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:scale-100"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] leading-snug font-normal transition-colors duration-150 ${
                      task.completed 
                        ? 'line-through text-muted-foreground/50' 
                        : 'text-foreground/90'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_hours}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Week indicator */}
              <p className="text-[11px] text-muted-foreground/40 pt-2 border-t border-border/10">
                Week {currentWeekIndex + 1} of {planData?.total_weeks || 0}
              </p>
            </div>
          ) : (
            <div 
              className="rounded-2xl p-8 text-center"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid hsl(var(--border) / 0.15)'
              }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-3">
                <Check className="w-4 h-4 text-primary/60" />
              </div>
              <p className="text-sm text-muted-foreground/60">
                You're clear for today.
              </p>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 3 — Progress & Momentum (Quiet Support)
            Informational, not motivating
        ═══════════════════════════════════════════════════════════════ */}
        {planData && (
          <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                Progress
              </p>
              {streak > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
                  <Flame className="w-3 h-3 text-orange-400/70" />
                  <span>{streak}d</span>
                </div>
              )}
            </div>

            <div 
              className="rounded-xl p-4"
              style={{
                background: 'hsl(var(--card) / 0.4)',
                border: '1px solid hsl(var(--border) / 0.1)'
              }}
            >
              {/* Progress bar */}
              <div className="space-y-2 mb-5">
                <Progress 
                  value={progressValue} 
                  className="h-1.5 bg-muted/30"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
                  <span>{progress.completed} of {progress.total} tasks</span>
                  <span>{progress.percent}%</span>
                </div>
              </div>

              {/* Primary CTA */}
              <Button
                variant="ghost"
                className="w-full h-10 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-colors duration-200"
                onClick={() => navigate('/plan')}
              >
                Continue My Plan
                <ArrowRight className="ml-2 w-3.5 h-3.5 opacity-50" />
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
