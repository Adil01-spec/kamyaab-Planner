import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { calculatePlanProgress } from '@/lib/planProgress';
import { getCurrentStreak, recordTaskCompletion } from '@/lib/streakTracker';
import { applyDynamicAccent } from '@/lib/dynamicAccent';
import { downloadICS, generateWeekCalendarEvents, getWeekStartDate } from '@/lib/calendarExport';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { ActiveWeekFocus } from '@/components/home/ActiveWeekFocus';
import { WeekOverview } from '@/components/home/WeekOverview';
import { 
  Loader2, 
  ArrowRight, 
  Flame,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';

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

// Get current week label
const getWeekLabel = (weekNumber: number): string => {
  const labels = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
  if (weekNumber <= labels.length) return `${labels[weekNumber - 1]} week`;
  return `Week ${weekNumber}`;
};

const Home = () => {
  const { user, profile, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bgPosition, setBgPosition] = useState({ x1: 25, y1: 20, x2: 75, y2: 80 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [breathePhase, setBreathePhase] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const animationRef = useRef<number>();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dynamic accent colors on mount and theme change
  useEffect(() => {
    const isDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyDynamicAccent(isDark);
  }, [theme]);

  // Breathing animation loop (reduced for accessibility)
  useEffect(() => {
    if (prefersReducedMotion) {
      setBreathePhase(0.5);
      return;
    }
    
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const phase = Math.sin(elapsed * Math.PI / 4) * 0.5 + 0.5;
      setBreathePhase(phase);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prefersReducedMotion]);

  // Position handler for mouse, touch, and device orientation
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (prefersReducedMotion) return;
    
    const x = clientX / window.innerWidth;
    const y = clientY / window.innerHeight;
    mousePos.current = { x, y };
    
    setBgPosition({
      x1: 20 + x * 15 + breathePhase * 5,
      y1: 15 + y * 20 + breathePhase * 8,
      x2: 80 - x * 15 - breathePhase * 5,
      y2: 85 - y * 20 - breathePhase * 8,
    });
    
    setParallax({
      x: (x - 0.5) * 16,
      y: (y - 0.5) * 12,
    });
  }, [breathePhase, prefersReducedMotion]);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [updatePosition]);

  // Track touch movement for mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [updatePosition]);

  // Device orientation tracking for mobile tilt
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      
      const x = Math.max(0, Math.min(1, (gamma + 30) / 60));
      const y = Math.max(0, Math.min(1, (beta - 30) / 60));
      
      setBgPosition({
        x1: 20 + x * 15 + breathePhase * 5,
        y1: 15 + y * 20 + breathePhase * 8,
        x2: 80 - x * 15 - breathePhase * 5,
        y2: 85 - y * 20 - breathePhase * 8,
      });
      
      setParallax({
        x: (x - 0.5) * 10,
        y: (y - 0.5) * 8,
      });
    };

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        const requestPermission = async () => {
          try {
            const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          } catch {
            // Permission denied
          }
        };
        
        const handleClick = () => {
          requestPermission();
          document.removeEventListener('click', handleClick);
        };
        document.addEventListener('click', handleClick, { once: true });
        
        return () => {
          document.removeEventListener('click', handleClick);
          window.removeEventListener('deviceorientation', handleOrientation);
        };
      } else {
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        return () => window.removeEventListener('deviceorientation', handleOrientation);
      }
    }
  }, [breathePhase, prefersReducedMotion]);

  const progress = calculatePlanProgress(planData);

  // Get active week index (first week with incomplete tasks)
  const getActiveWeekIndex = useCallback((): number => {
    if (!planData?.weeks) return 0;
    
    for (let i = 0; i < planData.weeks.length; i++) {
      const hasIncompleteTasks = planData.weeks[i].tasks.some(t => !t.completed);
      if (hasIncompleteTasks) return i;
    }
    
    return planData.weeks.length - 1;
  }, [planData]);

  // Check if a week is locked (future weeks are locked)
  const isWeekLocked = useCallback((weekIndex: number): boolean => {
    const activeIndex = getActiveWeekIndex();
    return weekIndex > activeIndex;
  }, [getActiveWeekIndex]);

  // Check if a week is completed
  const isWeekCompleted = useCallback((weekIndex: number): boolean => {
    if (!planData?.weeks?.[weekIndex]) return false;
    return planData.weeks[weekIndex].tasks.every(t => t.completed);
  }, [planData]);

  useEffect(() => {
    const fetchLatestPlan = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id, plan_json, created_at')
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
          setPlanCreatedAt(new Date(data.created_at));
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

    // Check if week is locked
    if (isWeekLocked(weekIndex)) {
      toast({
        title: "Week locked",
        description: "Complete the current week before moving to the next.",
        variant: "destructive",
      });
      return;
    }

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

      // Check if week just completed
      const weekNowCompleted = updatedPlan.weeks[weekIndex].tasks.every(t => t.completed);
      if (weekNowCompleted && !wasCompleted) {
        toast({
          title: `🎉 Week ${weekIndex + 1} Complete!`,
          description: weekIndex + 1 < updatedPlan.weeks.length 
            ? "Great work! Week " + (weekIndex + 2) + " is now unlocked."
            : "Amazing! You've completed all weeks!",
        });
      }
    } catch (err) {
      console.error('Error updating task:', err);
      task.completed = wasCompleted;
      setPlanData({ ...planData });
    }
  }, [planData, planId, isWeekLocked]);

  const handleAddToCalendar = useCallback(() => {
    if (!planData || !planCreatedAt) return;

    const activeIndex = getActiveWeekIndex();
    const activeWeek = planData.weeks[activeIndex];
    
    if (!activeWeek) return;

    const weekStartDate = getWeekStartDate(activeWeek.week, planCreatedAt);
    const { icsContent } = generateWeekCalendarEvents(
      activeWeek,
      weekStartDate,
      planData.project_title || 'Kaamyab Project'
    );

    downloadICS(icsContent, `kaamyab-week-${activeWeek.week}.ics`);

    toast({
      title: "Calendar file downloaded",
      description: "Import the .ics file into your calendar app.",
    });
  }, [planData, planCreatedAt, getActiveWeekIndex]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const userInitials = profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const activeWeekIndex = getActiveWeekIndex();
  const activeWeek = planData?.weeks?.[activeWeekIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background transition-colors relative overflow-hidden" 
      style={{ transitionDuration: 'var(--color-transition)' }}
    >
      {/* Two-tone dynamic ambient background with breathing */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse ${55 + breathePhase * 10}% ${45 + breathePhase * 10}% at ${bgPosition.x1}% ${bgPosition.y1}%, hsl(var(--dynamic-bg-1) / ${0.35 + breathePhase * 0.1}), transparent 70%),
            radial-gradient(ellipse ${45 + breathePhase * 10}% ${55 + breathePhase * 10}% at ${bgPosition.x2}% ${bgPosition.y2}%, hsl(var(--dynamic-bg-2) / ${0.3 + breathePhase * 0.1}), transparent 70%)
          `,
          transition: 'background 0.15s ease-out'
        }}
      />

      {/* Main Container - Responsive */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header 
          className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4"
          style={{
            background: 'hsl(var(--background) / 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground/80 font-normal">
                {getGreeting()}
              </p>
              <h1 className="text-base sm:text-lg font-semibold text-foreground/90 truncate max-w-[200px] sm:max-w-none">
                {planData?.project_title || profile?.fullName || 'Your Project'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{streak}d streak</span>
                </div>
              )}
              
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-opacity hover:opacity-80">
                    <Avatar className="h-9 w-9 border border-border/40">
                      <AvatarFallback className="bg-muted/50 text-muted-foreground font-medium text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card/95 backdrop-blur-xl border-border/30" align="end">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground/90">{profile?.fullName || 'User'}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem 
                    onClick={() => navigate('/plan')} 
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    View Full Plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content - Responsive Grid */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Hero Section */}
            <section 
              className="mb-8 sm:mb-10 animate-fade-in"
              style={{ 
                transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <div 
                className="rounded-2xl p-5 sm:p-6 lg:p-8"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid hsl(var(--border) / 0.1)',
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
                      {getWeekLabel(activeWeekIndex + 1)} of your journey
                    </p>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                      {activeWeek?.focus || 'Keep moving forward'}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground/80">
                      {progress.completed} of {progress.total} tasks completed • {progress.percent}% overall progress
                    </p>
                  </div>
                  
                  {/* Progress Circle */}
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="42%"
                          fill="none"
                          stroke="hsl(var(--muted) / 0.2)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="42%"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${progressValue * 2.64} 264`}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold text-primary">
                        {progress.percent}%
                      </span>
                    </div>
                    
                    <Button
                      onClick={() => navigate('/plan')}
                      variant="outline"
                      className="hidden sm:flex"
                    >
                      View Full Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Active Week Focus - Takes 2 columns on desktop */}
              <section 
                className="lg:col-span-2 animate-fade-in"
                style={{ animationDelay: '50ms' }}
              >
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
                  Active Week
                </p>
                
                {activeWeek ? (
                  <ActiveWeekFocus
                    weekNumber={activeWeekIndex + 1}
                    focus={activeWeek.focus}
                    tasks={activeWeek.tasks}
                    onTaskToggle={(taskIndex) => toggleTask(activeWeekIndex, taskIndex)}
                    onAddToCalendar={handleAddToCalendar}
                    totalWeeks={planData?.total_weeks || 0}
                  />
                ) : (
                  <div 
                    className="rounded-2xl p-8 text-center"
                    style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid hsl(var(--border) / 0.1)',
                    }}
                  >
                    <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No active tasks</p>
                  </div>
                )}
              </section>

              {/* Week Overview Sidebar */}
              <section 
                className="animate-fade-in"
                style={{ animationDelay: '100ms' }}
              >
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
                  All Weeks
                </p>
                
                <div 
                  className="rounded-2xl p-4 sm:p-5"
                  style={{
                    background: 'hsl(var(--card) / 0.3)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid hsl(var(--border) / 0.1)',
                  }}
                >
                  {planData?.weeks && (
                    <WeekOverview 
                      weeks={planData.weeks} 
                      activeWeekIndex={activeWeekIndex}
                    />
                  )}
                  
                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-border/10 flex flex-wrap gap-4 text-xs text-muted-foreground/60">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-primary/20 ring-1 ring-primary/40" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-primary/10 flex items-center justify-center">
                        <span className="text-[8px] text-primary">✓</span>
                      </div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-muted/30 opacity-50" />
                      <span>Locked</span>
                    </div>
                  </div>
                </div>

                {/* Mobile: View Full Plan Button */}
                <Button
                  onClick={() => navigate('/plan')}
                  className="w-full mt-4 sm:hidden gradient-kaamyab text-primary-foreground"
                >
                  View Full Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Motivation Card */}
                {planData?.motivation && planData.motivation.length > 0 && (
                  <div 
                    className="mt-4 rounded-xl p-4"
                    style={{
                      background: 'hsl(var(--primary) / 0.05)',
                      border: '1px solid hsl(var(--primary) / 0.1)',
                    }}
                  >
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      "{planData.motivation[Math.floor(Math.random() * planData.motivation.length)]}"
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
