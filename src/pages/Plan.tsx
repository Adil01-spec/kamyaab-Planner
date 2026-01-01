import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TaskItem } from '@/components/TaskItem';
import { WeeklyCalendarView } from '@/components/WeeklyCalendarView';
import { DeletePlanDialog } from '@/components/DeletePlanDialog';
import { calculatePlanProgress } from '@/lib/planProgress';
import { playCelebrationSound, playGrandCelebrationSound } from '@/lib/celebrationSound';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { 
  Rocket, LogOut, Target, Calendar, CalendarPlus,
  Sparkles, ChevronRight, Plus, Loader2, Quote, CheckCircle2, Trash2, ArrowRight, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { isAppleDevice } from '@/lib/calendarService';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface TaskExplanation {
  how: string;
  why: string;
  expected_outcome: string;
}

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  explanation?: TaskExplanation | string;
  how_to?: string;
  expected_outcome?: string;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
  calendar_synced?: boolean;
}

interface Milestone {
  title: string;
  week: number;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  milestones: Milestone[];
  weeks: Week[];
  motivation: string[];
  is_open_ended?: boolean;
}

const Plan = () => {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const celebratedWeeks = useRef<Set<number>>(new Set());
  const hasCompletedPlan = useRef(false);

  // Trigger confetti celebration with sound
  const triggerCelebration = useCallback(() => {
    playCelebrationSound();
    
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Trigger grand celebration for completing the entire plan
  const triggerGrandCelebration = useCallback(() => {
    playGrandCelebrationSound();
    
    // Grand confetti burst from center
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#22c55e', '#10b981']
    });

    // Continuous confetti from sides
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#06b6d4']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#06b6d4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Extra bursts at intervals
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.3, y: 0.4 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      });
    }, 500);

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.7, y: 0.4 },
        colors: ['#22c55e', '#10b981', '#14b8a6']
      });
    }, 1000);

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#fbbf24', '#22c55e', '#06b6d4', '#8b5cf6']
      });
    }, 1500);
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('plan_json, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.plan_json) {
          setPlan(data.plan_json as unknown as PlanData);
          setPlanCreatedAt(data.created_at);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Delete plan and redirect to reset flow
  const handleDeletePlan = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Plan deleted",
        description: "You can now create a fresh plan.",
      });

      setShowDeleteDialog(false);
      navigate('/plan/reset');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle task completion and persist to database
  const toggleTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!plan || !user) return;

    const updatedPlan = { ...plan };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    const wasCompleted = task.completed;
    task.completed = !task.completed;
    
    setPlan({ ...updatedPlan });
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if the entire plan is now completed
      const allTasksCompleted = updatedPlan.weeks.every(w => 
        w.tasks.every(t => t.completed)
      );

      if (allTasksCompleted && !wasCompleted && !hasCompletedPlan.current) {
        hasCompletedPlan.current = true;
        triggerGrandCelebration();
        toast({
          title: "🏆 Plan Complete!",
          description: "Incredible! You've completed your entire plan. You're unstoppable!",
        });
      } else {
        // Check if the week is now fully completed (and wasn't before)
        const week = updatedPlan.weeks[weekIndex];
        const weekNowCompleted = week.tasks.every(t => t.completed);
        
        if (weekNowCompleted && !wasCompleted && !celebratedWeeks.current.has(weekIndex)) {
          celebratedWeeks.current.add(weekIndex);
          triggerCelebration();
          toast({
            title: `🎉 Week ${week.week} Complete!`,
            description: "Amazing progress! Keep up the great work!",
          });
        }
      }
    } catch (error) {
      console.error('Error saving task completion:', error);
      task.completed = !task.completed;
      setPlan({ ...updatedPlan });
    } finally {
      setSaving(false);
    }
  }, [plan, user, triggerCelebration, triggerGrandCelebration]);

  // Calculate overall progress using the shared utility
  const progress = calculatePlanProgress(plan);

  // Check if user is nearing the end of their plan (last 2 weeks or 75%+ completed)
  const isNearingPlanEnd = useCallback(() => {
    if (!plan || !plan.is_open_ended) return false;
    
    const totalWeeks = plan.weeks.length;
    const completedWeeks = plan.weeks.filter(week => 
      week.tasks.every(task => task.completed)
    ).length;
    
    // Show extend button if 75%+ weeks completed or in last 2 weeks
    return completedWeeks >= totalWeeks - 2 || progress.percent >= 75;
  }, [plan, progress.percent]);

  // Extend plan with additional weeks
  const handleExtendPlan = async () => {
    if (!plan || !profile || !user) return;
    
    setIsExtending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('extend-plan', {
        body: {
          profile: {
            fullName: profile.fullName,
            profession: profile.profession,
            professionDetails: profile.professionDetails,
            projectTitle: profile.projectTitle,
            projectDescription: profile.projectDescription,
          },
          existingPlan: plan,
          weeksToAdd: 4,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) throw response.error;

      const { plan: extendedPlan } = response.data;
      setPlan(extendedPlan);
      
      toast({
        title: "Plan extended!",
        description: `Added 4 more weeks to your plan.`,
      });
    } catch (error) {
      console.error('Error extending plan:', error);
      toast({
        title: "Extension failed",
        description: "Could not extend your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtending(false);
    }
  };

  const showExtendButton = isNearingPlanEnd();

  // Calendar sync hook - pass plan's created_at for correct date calculation
  const {
    isSyncing: isCalendarSyncing,
    syncingWeek,
    syncWeek,
    canSyncWeek,
    getDisabledReason,
  } = useCalendarSync({
    userId: user?.id || '',
    weeks: plan?.weeks || [],
    planCreatedAt: planCreatedAt || undefined,
  });
  
  // Calendar refresh key - triggered when tasks are marked as scheduled
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerCalendarRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({ currentRoute: '/plan' });

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen gradient-subtle pb-20 sm:pb-0"
      {...swipeHandlers.handlers}
    >
      {/* Header - Touch optimized */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-kaamyab flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground hidden sm:block">Kaamyab</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="touch-press text-muted-foreground hover:text-foreground min-h-[44px] px-3"
            >
              <Home className="w-5 h-5 sm:mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {saving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            <ThemeToggle />
            {profile && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile.fullName.split(' ')[0]}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="touch-press min-h-[44px] px-3">
              <LogOut className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!plan ? (
          /* No Plan State */
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/30 mb-6">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                No Plan Yet
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate your personalized AI productivity plan to start achieving your goals.
              </p>
              <Button 
                onClick={() => navigate('/plan/reset')} 
                className="gradient-kaamyab hover:opacity-90 btn-press"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Plan Display */
          <div className="space-y-6">
            {/* Overview */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">Your AI Plan</h1>
              <p className="text-muted-foreground">{plan.overview}</p>
            </div>

            {/* Progress Overview Card */}
            <Card className="glass-card glass-card-hover animate-slide-up">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Overall Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        {progress.completed} of {progress.total} tasks completed
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} className="h-3" />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {profile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Project</p>
                    <p className="font-semibold text-foreground truncate">{profile.projectTitle}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Total Weeks</p>
                    <p className="font-semibold text-primary text-2xl">{plan.total_weeks}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Deadline</p>
                    <p className="font-semibold text-foreground">
                      {profile.projectDeadline 
                        ? new Date(profile.projectDeadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Open-ended'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Weekly Calendar View */}
            <WeeklyCalendarView 
              weeks={plan.weeks}
              planCreatedAt={planCreatedAt || undefined}
              activeWeekIndex={plan.weeks.findIndex(w => !w.tasks.every(t => t.completed))}
              refreshKey={refreshKey}
            />

            {/* Milestones */}
            {plan.milestones && plan.milestones.length > 0 && (
              <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle>Key Milestones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {plan.milestones.map((milestone, index) => (
                        <div key={index} className="relative flex items-center gap-4 pl-8">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          <div className="flex-1 flex items-center justify-between p-3 glass-subtle rounded-lg">
                            <span className="font-medium">{milestone.title}</span>
                            <Badge variant="outline" className="text-xs">
                              Week {milestone.week}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Plans */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Breakdown
              </h2>
              {plan.weeks.map((week, weekIndex) => {
                const weekCompleted = week.tasks.filter(t => t.completed).length;
                const weekTotal = week.tasks.length;
                const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
                const isWeekComplete = weekCompleted === weekTotal;
                
                // Sequential unlock: find the first incomplete week
                const firstIncompleteWeekIndex = plan.weeks.findIndex(w => 
                  !w.tasks.every(t => t.completed)
                );
                const isActiveWeek = weekIndex === firstIncompleteWeekIndex;
                const isLockedWeek = firstIncompleteWeekIndex !== -1 && weekIndex > firstIncompleteWeekIndex;
                const isPastWeek = isWeekComplete && weekIndex < firstIncompleteWeekIndex;
                
                const canSync = canSyncWeek(weekIndex);
                const disabledReason = getDisabledReason(weekIndex);
                const isSyncingThisWeek = isCalendarSyncing && syncingWeek === week.week;
                
                return (
                  <Card 
                    key={week.week} 
                    className={cn(
                      "glass-card animate-slide-up transition-all duration-300",
                      isActiveWeek && "ring-2 ring-primary/50 glass-card-hover",
                      isLockedWeek && "opacity-70",
                      isWeekComplete && "border-primary/20"
                    )}
                    style={{ animationDelay: `${0.1 * (weekIndex + 2)}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold transition-all",
                            isWeekComplete ? "bg-primary" : isActiveWeek ? "gradient-kaamyab" : "bg-muted text-muted-foreground"
                          )}>
                            {isWeekComplete ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isLockedWeek ? (
                              <span className="text-muted-foreground">{week.week}</span>
                            ) : (
                              week.week
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className={cn(
                                "text-lg",
                                isLockedWeek && "text-muted-foreground"
                              )}>
                                Week {week.week}
                              </CardTitle>
                              {isActiveWeek && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                                  Current
                                </Badge>
                              )}
                              {isLockedWeek && (
                                <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
                                  Locked
                                </Badge>
                              )}
                              {isWeekComplete && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "text-sm text-muted-foreground",
                              isLockedWeek && "opacity-70"
                            )}>
                              {week.focus}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {weekCompleted}/{weekTotal}
                          </span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500",
                                isWeekComplete ? "bg-primary" : "bg-primary/70"
                              )}
                              style={{ width: `${weekPercent}%` }}
                            />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {week.tasks.map((task, taskIndex) => (
                          <TaskItem
                            key={taskIndex}
                            title={task.title}
                            priority={task.priority}
                            estimatedHours={task.estimated_hours}
                            completed={task.completed || false}
                            onToggle={() => toggleTask(weekIndex, taskIndex)}
                            explanation={task.explanation}
                            howTo={task.how_to}
                            expectedOutcome={task.expected_outcome}
                            isLocked={isLockedWeek}
                            weekNumber={week.week}
                            taskIndex={taskIndex}
                            showCalendarButton={isActiveWeek && !isWeekComplete}
                            planCreatedAt={planCreatedAt || undefined}
                            onCalendarStatusChange={triggerCalendarRefresh}
                          />
                        ))}
                      </div>
                      
                      {/* Calendar Sync Button - Only for active week */}
                      {isActiveWeek && !isWeekComplete && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => syncWeek(weekIndex)}
                            disabled={!canSync || isSyncingThisWeek}
                            className="w-full sm:w-auto touch-press glass border-primary/30 hover:bg-primary/5 disabled:opacity-50 min-h-[48px]"
                            title={disabledReason || undefined}
                          >
                            {isSyncingThisWeek ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Adding to Calendar...
                              </>
                            ) : (
                              <>
                                <CalendarPlus className="w-5 h-5 mr-2" />
                                {isAppleDevice() ? 'Add to Apple Calendar' : 'Add This Week to Calendar'}
                              </>
                            )}
                          </Button>
                          {disabledReason && !canSync && (
                            <p className="text-xs text-muted-foreground mt-1.5">{disabledReason}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Locked week message */}
                      {isLockedWeek && (
                        <div className="mt-4 pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span>🔒</span>
                            <span>Complete Week {firstIncompleteWeekIndex + 1} to unlock this week</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Motivation */}
            {plan.motivation && plan.motivation.length > 0 && (
              <Card className="glass-card border-primary/20 animate-slide-up">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Quote className="w-5 h-5 text-primary" />
                    <CardTitle className="text-foreground">Stay Motivated</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.motivation.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-primary/60" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Extend Plan Banner for Open-ended Projects */}
            {showExtendButton && (
              <Card className="glass-card border-primary/30 animate-slide-up">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Keep the momentum going!</h3>
                        <p className="text-sm text-muted-foreground">
                          You're nearing the end of your current plan. Add more weeks to stay on track.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleExtendPlan}
                      disabled={isExtending}
                      className="gradient-kaamyab hover:opacity-90 btn-press whitespace-nowrap"
                    >
                      {isExtending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Extending...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Extend Plan (+4 weeks)
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Touch optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(true)}
                className="touch-press glass border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 min-h-[48px]"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete this plan
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/plan/new')}
                className="touch-press glass border-primary/30 hover:bg-primary/5 min-h-[48px]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate New Plan
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeletePlanDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeletePlan}
        isDeleting={isDeleting}
      />
      
      <BottomNav />
    </div>
  );
};

export default Plan;