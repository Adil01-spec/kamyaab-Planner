import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { calculatePlanProgress } from '@/lib/planProgress';
import { getCurrentStreak, recordTaskCompletion } from '@/lib/streakTracker';
import { applyDynamicAccent } from '@/lib/dynamicAccent';
import { useTheme } from 'next-themes';
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
import { ThemeToggle } from '@/components/ThemeToggle';
import { BottomNav } from '@/components/BottomNav';

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
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
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
      setBreathePhase(0.5); // Static middle state
      return;
    }
    
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Slow breathing: 8 second cycle
      const phase = Math.sin(elapsed * Math.PI / 4) * 0.5 + 0.5;
      setBreathePhase(phase);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prefersReducedMotion]);

  // Unified position handler for mouse, touch, and device orientation
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (prefersReducedMotion) return; // Skip motion updates
    
    const x = clientX / window.innerWidth;
    const y = clientY / window.innerHeight;
    mousePos.current = { x, y };
    
    // Background position
    setBgPosition({
      x1: 20 + x * 15 + breathePhase * 5,
      y1: 15 + y * 20 + breathePhase * 8,
      x2: 80 - x * 15 - breathePhase * 5,
      y2: 85 - y * 20 - breathePhase * 8,
    });
    
    // Parallax offset (subtle: -8px to +8px)
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
      // gamma: left/right tilt (-90 to 90)
      // beta: front/back tilt (-180 to 180)
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      
      // Normalize to 0-1 range (clamp to reasonable tilt angles ±30°)
      const x = Math.max(0, Math.min(1, (gamma + 30) / 60));
      const y = Math.max(0, Math.min(1, (beta - 30) / 60)); // beta ~45-90 is natural phone hold
      
      // Background position based on tilt
      setBgPosition({
        x1: 20 + x * 15 + breathePhase * 5,
        y1: 15 + y * 20 + breathePhase * 8,
        x2: 80 - x * 15 - breathePhase * 5,
        y2: 85 - y * 20 - breathePhase * 8,
      });
      
      // Parallax based on tilt (gentler than mouse)
      setParallax({
        x: (x - 0.5) * 10,
        y: (y - 0.5) * 8,
      });
    };

    // Check if DeviceOrientationEvent is available and requires permission
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // For iOS 13+ we need to request permission
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        // Permission will be requested on first user interaction
        const requestPermission = async () => {
          try {
            const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          } catch {
            // Permission denied or error
          }
        };
        
        // Add one-time click listener to request permission
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
        // Non-iOS devices don't need permission
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        return () => window.removeEventListener('deviceorientation', handleOrientation);
      }
    }
  }, [breathePhase, prefersReducedMotion]);

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
    <div 
      className="min-h-screen bg-background transition-colors relative overflow-hidden pb-20 sm:pb-0" 
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

      <div className="container max-w-xl mx-auto px-5 py-8 relative z-10">
        
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
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
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
          </div>
          
          {/* Subtle divider with dynamic accent */}
          <div 
            className="mt-6 h-px transition-colors"
            style={{ 
              background: 'linear-gradient(90deg, transparent, hsl(var(--dynamic-accent) / 0.2), transparent)',
              transitionDuration: 'var(--color-transition)'
            }} 
          />
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            ZONE 2 — Today's Focus (Hero Section)
            Visual anchor of the Home screen
        ═══════════════════════════════════════════════════════════════ */}
        <section 
          className="mb-10 animate-fade-in" 
          style={{ 
            animationDelay: '50ms',
            transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest mb-4">
            Today's Focus
          </p>

          {todaysTasks.length > 0 ? (
            <div 
              className="relative rounded-2xl p-5 space-y-4 transition-shadow"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid hsl(var(--border) / 0.12)',
                boxShadow: 'var(--shadow-glow), 0 4px 20px -6px hsl(var(--dynamic-accent) / 0.08)',
                transitionDuration: 'var(--color-transition)',
                transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)`,
              }}
            >
              {/* Dynamic accent gradient at top */}
              <div 
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl transition-colors"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--dynamic-accent) / 0.4), transparent)',
                  transitionDuration: 'var(--color-transition)'
                }}
              />

              {todaysTasks.map(({ task, weekIndex, taskIndex }) => (
                <div
                  key={`${weekIndex}-${taskIndex}`}
                  onClick={() => toggleTask(weekIndex, taskIndex)}
                  className="group flex items-start gap-4 cursor-pointer rounded-xl p-3 -mx-2 transition-all"
                  style={{
                    boxShadow: 'inset 0 0 0 1px transparent',
                    transition: 'box-shadow 0.25s ease, background 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px hsl(var(--dynamic-accent) / 0.12)';
                    e.currentTarget.style.background = 'hsl(var(--dynamic-accent) / 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px transparent';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={task.completed || false}
                      onCheckedChange={() => toggleTask(weekIndex, taskIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-[18px] w-[18px] rounded-[5px] border border-border/50 transition-all duration-150"
                      style={{
                        '--tw-bg-opacity': task.completed ? '1' : '0',
                        backgroundColor: task.completed ? 'hsl(var(--dynamic-accent-fill))' : undefined,
                        borderColor: task.completed ? 'hsl(var(--dynamic-accent-fill))' : undefined,
                      } as React.CSSProperties}
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
              className="rounded-2xl p-8 text-center transition-colors"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid hsl(var(--border) / 0.12)',
                transitionDuration: 'var(--color-transition)'
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors"
                style={{ 
                  background: 'hsl(var(--dynamic-accent-muted) / 0.4)',
                  transitionDuration: 'var(--color-transition)'
                }}
              >
                <Check 
                  className="w-4 h-4 transition-colors" 
                  style={{ 
                    color: 'hsl(var(--dynamic-accent))',
                    transitionDuration: 'var(--color-transition)'
                  }} 
                />
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
          <section 
            className="animate-fade-in" 
            style={{ 
              animationDelay: '100ms',
              transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
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
              className="rounded-xl p-4 transition-colors"
              style={{
                background: 'hsl(var(--card) / 0.35)',
                border: '1px solid hsl(var(--border) / 0.08)',
                transitionDuration: 'var(--color-transition)',
                transform: `translate3d(${parallax.x * 0.2}px, ${parallax.y * 0.2}px, 0)`,
              }}
            >
              {/* Progress bar with dynamic accent */}
              <div className="space-y-2 mb-5">
                <div 
                  className="h-1.5 rounded-full overflow-hidden transition-colors"
                  style={{ 
                    background: 'hsl(var(--muted) / 0.25)',
                    transitionDuration: 'var(--color-transition)'
                  }}
                >
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${progressValue}%`,
                      background: 'hsl(var(--dynamic-accent-fill))',
                      transitionDuration: '800ms',
                      transitionTimingFunction: 'ease-out'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
                  <span>{progress.completed} of {progress.total} tasks</span>
                  <span>{progress.percent}%</span>
                </div>
              </div>

              {/* Primary CTA */}
              <Button
                variant="ghost"
                className="w-full h-10 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                style={{
                  transitionDuration: 'var(--color-transition)'
                }}
                onClick={() => navigate('/plan')}
              >
                Continue My Plan
                <ArrowRight className="ml-2 w-3.5 h-3.5 opacity-40" />
              </Button>
            </div>
          </section>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Home;
