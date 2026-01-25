import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskItem } from '@/components/TaskItem';
import { WeeklyCalendarView } from '@/components/WeeklyCalendarView';
import { DeletePlanDialog } from '@/components/DeletePlanDialog';
import { DynamicBackground } from '@/components/DynamicBackground';
import { DesktopHamburgerMenu } from '@/components/DesktopHamburgerMenu';
import { ActiveTimerBanner } from '@/components/ActiveTimerBanner';
import { StartTaskModal } from '@/components/StartTaskModal';
import { calculatePlanProgress } from '@/lib/planProgress';
import { playCelebrationSound, playGrandCelebrationSound } from '@/lib/celebrationSound';
import { useExecutionTimer } from '@/hooks/useExecutionTimer';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { 
  Rocket, LogOut, Target, Calendar, CalendarPlus,
  Sparkles, ChevronRight, Plus, Loader2, Quote, CheckCircle2, Trash2, ArrowRight,
  GitBranch, List, ChevronDown, Lightbulb, AlertTriangle
} from 'lucide-react';
import { IdentityStatementEditor } from '@/components/IdentityStatementEditor';
import { PlanRealityCheck } from '@/components/PlanRealityCheck';
import { ExecutionInsights, type ExecutionInsightsData } from '@/components/ExecutionInsights';
import { CalibrationInsights } from '@/components/CalibrationInsights';
import { PersonalPatternUpdate } from '@/components/PersonalPatternUpdate';
import { ProgressProof } from '@/components/ProgressProof';
import { PlanFlowView } from '@/components/PlanFlowView';
import { 
  fetchExecutionProfile, 
  extractProfileFromPlan,
  mergeProfileUpdates,
  saveExecutionProfile,
  type PersonalExecutionProfile,
  type ProgressHistory 
} from '@/lib/personalExecutionProfile';
import { 
  createPlanCycleSnapshot, 
  appendSnapshotToHistory 
} from '@/lib/progressProof';
import { compileExecutionMetrics } from '@/lib/executionAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { isAppleDevice } from '@/lib/calendarService';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useMobileSettings } from '@/hooks/useMobileSettings';
import { useDesktopSettings } from '@/hooks/useDesktopSettings';
import { DevPanel } from '@/components/DevPanel';

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

interface StrategicMilestone extends Milestone {
  outcome?: string;
  timeframe?: string;
}

interface Risk {
  risk: string;
  mitigation?: string;
}

interface StrategyOverview {
  objective: string;
  why_now?: string;
  success_definition?: string;
}

interface RealityCritique {
  feasibility: {
    assessment: 'realistic' | 'challenging' | 'unrealistic';
    summary: string;
    concerns: string[];
  };
  risk_signals: { items: { signal: string; severity: 'low' | 'medium' | 'high' }[] };
  focus_gaps: { items: string[]; strategic_blind_spots?: string[] };
  deprioritization_suggestions: { items: { task_or_area: string; reason: string }[] };
  is_strategic: boolean;
  generated_at: string;
  plan_version?: string;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  milestones: Milestone[] | StrategicMilestone[];
  weeks: Week[];
  motivation: string[];
  is_open_ended?: boolean;
  identity_statement?: string;
  // Strategic plan fields (optional)
  is_strategic_plan?: boolean;
  strategy_overview?: StrategyOverview;
  assumptions?: string[];
  risks?: Risk[];
  // Reality check cache
  reality_check?: RealityCritique;
  // Execution insights cache
  execution_insights?: ExecutionInsightsData;
}

const Plan = () => {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showStartTaskModal, setShowStartTaskModal] = useState(false);
  const [showPatternUpdate, setShowPatternUpdate] = useState(false);
  const [previousProfile, setPreviousProfile] = useState<PersonalExecutionProfile | null>(null);
  const [currentProfile, setCurrentProfile] = useState<PersonalExecutionProfile | null>(null);
  const [pendingStartTask, setPendingStartTask] = useState<{
    weekIndex: number;
    taskIndex: number;
    title: string;
    estimatedHours: number;
  } | null>(null);
  const celebratedWeeks = useRef<Set<number>>(new Set());
  const hasCompletedPlan = useRef(false);
  
  // Settings for dynamic background
  const { settings: mobileSettings, isMobile } = useMobileSettings();
  const { settings: desktopSettings, isDesktop, toggleSetting, updateSettings, resetToDefaults } = useDesktopSettings();
  const dynamicBackgroundEnabled = isMobile ? mobileSettings.dynamicBackground : desktopSettings.dynamicBackground;
  const backgroundPattern = isMobile ? mobileSettings.backgroundPattern : desktopSettings.backgroundPattern;
  const parallaxEnabled = isMobile ? mobileSettings.parallaxEffects : desktopSettings.parallaxEffects;

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
          .select('id, plan_json, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.plan_json) {
          setPlanId(data.id);
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

  // Initialize execution timer hook
  const executionTimer = useExecutionTimer({
    planData: plan,
    planId,
    onPlanUpdate: (updatedPlan) => setPlan(updatedPlan as PlanData),
  });

  // Execution timer handlers for Plan page
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
      // Navigate to Today page to focus on the task
      navigate('/today');
    }
  }, [pendingStartTask, executionTimer, navigate]);

  const handleTimerComplete = useCallback(async () => {
    await executionTimer.completeTaskTimer();
  }, [executionTimer]);

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
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex] as any;
    const wasCompleted = task.execution_state === 'done' || task.completed;
    
    // Update execution_state (source of truth) and legacy completed
    if (wasCompleted) {
      task.execution_state = 'pending';
      task.completed = false;
    } else {
      task.execution_state = 'done';
      task.completed = true;
      task.completed_at = new Date().toISOString();
    }
    
    setPlan({ ...updatedPlan });
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if the entire plan is now completed (using execution_state)
      const allTasksCompleted = updatedPlan.weeks.every(w => 
        w.tasks.every(t => (t as any).execution_state === 'done' || t.completed)
      );

      if (allTasksCompleted && !wasCompleted && !hasCompletedPlan.current) {
        hasCompletedPlan.current = true;
        triggerGrandCelebration();
        toast({
          title: "🏆 Plan Complete!",
          description: "Incredible! You've completed your entire plan. You're unstoppable!",
        });
        
        // Trigger personal pattern update
        triggerPatternUpdate(updatedPlan);
      } else {
        // Check if the week is now fully completed (and wasn't before)
        const week = updatedPlan.weeks[weekIndex];
        const weekNowCompleted = week.tasks.every(t => (t as any).execution_state === 'done' || t.completed);
        
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
      // Revert execution_state
      if (wasCompleted) {
        task.execution_state = 'done';
        task.completed = true;
      } else {
        task.execution_state = 'pending';
        task.completed = false;
      }
      setPlan({ ...updatedPlan });
    } finally {
      setSaving(false);
    }
  }, [plan, user, triggerCelebration, triggerGrandCelebration]);

  // Update identity statement
  const updateIdentityStatement = useCallback(async (statement: string) => {
    if (!plan || !user) return;

    const updatedPlan = { ...plan, identity_statement: statement };
    setPlan(updatedPlan);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving identity statement:', error);
      setPlan(plan); // Revert
    } finally {
      setSaving(false);
    }
  }, [plan, user]);

  // Save reality check critique to plan
  const handleCritiqueGenerated = useCallback(async (critique: RealityCritique) => {
    if (!plan || !user) return;

    const updatedPlan = { ...plan, reality_check: critique };
    setPlan(updatedPlan);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving reality check:', error);
      // Don't revert - the critique is still useful locally
    } finally {
      setSaving(false);
    }
  }, [plan, user]);

  // Save execution insights to plan
  const handleInsightsGenerated = useCallback(async (insights: ExecutionInsightsData) => {
    if (!plan || !user) return;

    const updatedPlan = { ...plan, execution_insights: insights };
    setPlan(updatedPlan);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving execution insights:', error);
    } finally {
      setSaving(false);
    }
  }, [plan, user]);

  // Trigger personal pattern update after plan completion
  const triggerPatternUpdate = useCallback(async (completedPlan: PlanData) => {
    if (!user) return;
    
    try {
      // Fetch previous profile
      const prevProfile = await fetchExecutionProfile(user.id);
      setPreviousProfile(prevProfile);
      
      // Extract and merge new observations
      const newObservations = extractProfileFromPlan(completedPlan);
      const mergedProfile = mergeProfileUpdates(prevProfile, newObservations);
      
      // Create and append progress snapshot (Phase 8.7)
      const isStrategic = completedPlan.is_strategic_plan || false;
      const snapshot = createPlanCycleSnapshot(completedPlan, isStrategic);
      const updatedHistory = appendSnapshotToHistory(
        mergedProfile.progress_history,
        snapshot
      );
      
      // Update profile with progress history
      const profileWithHistory: PersonalExecutionProfile = {
        ...mergedProfile,
        progress_history: updatedHistory,
      };
      
      setCurrentProfile(profileWithHistory);
      
      // Save updated profile with progress history
      await saveExecutionProfile(user.id, profileWithHistory);
      
      // Show the pattern update modal
      setShowPatternUpdate(true);
    } catch (error) {
      console.error('Error updating personal profile:', error);
    }
  }, [user]);

  // Calculate overall progress using the shared utility
  const progress = calculatePlanProgress(plan);

  // Check if user is nearing the end of their plan (last 2 weeks or 75%+ completed)
  const isNearingPlanEnd = useCallback(() => {
    if (!plan || !plan.is_open_ended) return false;
    
    const totalWeeks = plan.weeks.length;
    const completedWeeks = plan.weeks.filter(week => 
      week.tasks.every(task => (task as any).execution_state === 'done' || task.completed)
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

  // Flow view interaction state - disable swipe when user is interacting with flow
  const [flowViewActive, setFlowViewActive] = useState(false);

  // Swipe navigation - disabled when flow view is active
  const swipeHandlers = useSwipeNavigation({ 
    currentRoute: '/plan',
    enabled: !flowViewActive
  });

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen gradient-subtle pb-20 sm:pb-0 relative"
      {...swipeHandlers.handlers}
    >
      {/* Dynamic time-based background illustrations */}
      <DynamicBackground 
        enabled={dynamicBackgroundEnabled} 
        pattern={backgroundPattern}
        parallaxEnabled={parallaxEnabled}
        deviceMotionEnabled={mobileSettings.deviceMotion}
      />
      
      {/* Header - Touch optimized */}
      <header className="glass sticky top-0 z-10 relative">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Hamburger Menu */}
            <DesktopHamburgerMenu
              settings={desktopSettings}
              onToggle={toggleSetting}
              onUpdateSettings={updateSettings}
              onReset={resetToDefaults}
            />
            <div className="flex items-center gap-2 sm:hidden">
              <div className="w-9 h-9 rounded-lg gradient-kaamyab flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {saving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
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
            {/* Overview with Identity Statement */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">Your AI Plan</h1>
              <p className="text-muted-foreground mb-3">{plan.overview}</p>
              <IdentityStatementEditor
                value={plan.identity_statement || ''}
                onChange={updateIdentityStatement}
              />
            </div>

            {/* Strategic Plan Section - Only for strategic plans */}
            {plan.is_strategic_plan && plan.strategy_overview && (
              <Collapsible defaultOpen={false} className="animate-slide-up">
                <Card className="glass-card overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 cursor-pointer hover:bg-accent/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-lg">Strategy Overview</CardTitle>
                            <p className="text-sm text-muted-foreground font-normal">
                              Strategic context for this plan
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            Strategic Plan
                          </Badge>
                          <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Objective */}
                      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-foreground">Objective</h4>
                        </div>
                        <p className="text-muted-foreground">{plan.strategy_overview.objective}</p>
                      </div>

                      {/* Why Now */}
                      {plan.strategy_overview.why_now && (
                        <div className="p-4 rounded-lg bg-muted/50">
                          <h4 className="font-medium text-foreground mb-2">Why Now</h4>
                          <p className="text-muted-foreground">{plan.strategy_overview.why_now}</p>
                        </div>
                      )}

                      {/* Success Definition */}
                      {plan.strategy_overview.success_definition && (
                        <div className="p-4 rounded-lg bg-muted/50">
                          <h4 className="font-medium text-foreground mb-2">Success Definition</h4>
                          <p className="text-muted-foreground">{plan.strategy_overview.success_definition}</p>
                        </div>
                      )}

                      {/* Assumptions */}
                      {plan.assumptions && plan.assumptions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Key Assumptions</h4>
                          <ul className="space-y-1">
                            {plan.assumptions.map((assumption, i) => (
                              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span>{assumption}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risks */}
                      {plan.risks && plan.risks.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            Risks & Mitigations
                          </h4>
                          <div className="space-y-2">
                            {plan.risks.map((riskItem, i) => (
                              <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                <p className="text-foreground font-medium">{riskItem.risk}</p>
                                {riskItem.mitigation && (
                                  <p className="text-muted-foreground text-sm mt-1">
                                    <span className="text-primary">Mitigation:</span> {riskItem.mitigation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strategic Milestones Preview */}
                      {plan.milestones && plan.milestones.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Strategic Milestones</h4>
                          <div className="space-y-2">
                            {(plan.milestones as StrategicMilestone[]).map((milestone, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <span className="text-foreground">{milestone.title}</span>
                                <div className="flex items-center gap-2">
                                  {milestone.timeframe && (
                                    <span className="text-xs text-muted-foreground">{milestone.timeframe}</span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    Week {milestone.week}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Plan Reality Check - AI-powered critique */}
            {planId && (
              <PlanRealityCheck
                plan={plan}
                planId={planId}
                cachedCritique={plan.reality_check}
                onCritiqueGenerated={handleCritiqueGenerated}
              />
            )}

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

            {/* Execution Insights - Post-execution analysis */}
            {planId && (
              <ExecutionInsights
                planData={plan}
                planId={planId}
                cachedInsights={plan.execution_insights}
                onInsightsGenerated={handleInsightsGenerated}
              />
            )}

            {/* Calibration Insights - Personalized historical patterns */}
            {user && (
              <CalibrationInsights
                userId={user.id}
                currentPlanData={plan}
              />
            )}

            {/* Progress Proof - Evidence of improvement over time */}
            {user && (
              <ProgressProof
                userId={user.id}
                currentPlanData={plan}
              />
            )}

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
              activeWeekIndex={plan.weeks.findIndex(w => !w.tasks.every(t => (t as any).execution_state === 'done' || t.completed))}
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

            {/* View Toggle - List vs Flow */}
            <Tabs defaultValue="list" className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Breakdown
                </h2>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="list" className="flex items-center gap-2 text-xs px-3">
                    <List className="w-3.5 h-3.5" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="flow" className="flex items-center gap-2 text-xs px-3">
                    <GitBranch className="w-3.5 h-3.5" />
                    Flow
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="space-y-4 mt-0">
              {plan.weeks.map((week, weekIndex) => {
                const weekCompleted = week.tasks.filter(t => (t as any).execution_state === 'done' || t.completed).length;
                const weekTotal = week.tasks.length;
                const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
                const isWeekComplete = weekCompleted === weekTotal;
                
                // Sequential unlock: find the first incomplete week
                const firstIncompleteWeekIndex = plan.weeks.findIndex(w => 
                  !w.tasks.every(t => (t as any).execution_state === 'done' || t.completed)
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
                            onStartTask={() => handleStartTaskClick(weekIndex, taskIndex, task.title, task.estimated_hours)}
                            executionState={
                              (task as any).execution_state === 'doing' ? 'doing' :
                              (task as any).execution_state === 'done' ? 'done' :
                              executionTimer.activeTimer?.weekIndex === weekIndex && executionTimer.activeTimer?.taskIndex === taskIndex ? 'doing' :
                              'pending'
                            }
                            elapsedSeconds={executionTimer.activeTimer?.weekIndex === weekIndex && executionTimer.activeTimer?.taskIndex === taskIndex ? executionTimer.elapsedSeconds : 0}
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
              </TabsContent>

              <TabsContent value="flow" className="mt-0">
                <Card className="glass-card overflow-hidden">
                  <CardContent className="py-4 px-0">
                    <PlanFlowView
                      weeks={plan.weeks}
                      identityStatement={plan.identity_statement}
                      projectTitle={profile?.projectTitle}
                      onInteractionStart={() => setFlowViewActive(true)}
                      onInteractionEnd={() => setFlowViewActive(false)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
      
      {/* Start Task Modal */}
      <StartTaskModal
        open={showStartTaskModal}
        onOpenChange={setShowStartTaskModal}
        taskTitle={pendingStartTask?.title || ''}
        estimatedHours={pendingStartTask?.estimatedHours || 1}
        onStart={handleConfirmStartTask}
        isStarting={executionTimer.isStarting}
      />
      
      {/* Active Timer Banner - Compact version for Plan page */}
      {executionTimer.activeTimer && (
        <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <ActiveTimerBanner
            taskTitle={executionTimer.activeTimer.taskTitle}
            elapsedSeconds={executionTimer.elapsedSeconds}
            onComplete={handleTimerComplete}
            onPause={executionTimer.pauseTaskTimer}
            isCompleting={executionTimer.isCompleting}
            isPausing={executionTimer.isPausing}
            variant="compact"
          />
        </div>
      )}
      
      {/* Dev Panel */}
      <div className="max-w-4xl mx-auto px-4">
        <DevPanel
          pageId="plan"
          data={{
            loading,
            saving,
            planId,
            totalWeeks: plan?.weeks?.length || 0,
            progress,
            showExtendButton,
            isExtending,
            activeTimer: executionTimer.activeTimer,
            weeks: plan?.weeks?.map((w, i) => ({
              week: w.week,
              focus: w.focus,
              taskCount: w.tasks.length,
              completedCount: w.tasks.filter(t => (t as any).execution_state === 'done' || t.completed).length,
            })) || [],
          }}
        />
      </div>

      <BottomNav />

      {/* Personal Pattern Update Modal - Shown after plan completion */}
      {currentProfile && (
        <PersonalPatternUpdate
          open={showPatternUpdate}
          onClose={() => setShowPatternUpdate(false)}
          previousProfile={previousProfile}
          currentProfile={currentProfile}
          planSummary={{
            tasksCompleted: progress.completed,
            totalTimeSpent: plan ? compileExecutionMetrics(plan).totalTimeSpent : 0,
            averageVariance: plan ? compileExecutionMetrics(plan).estimationAccuracy.averageVariance : 0,
          }}
        />
      )}
    </div>
  );
};

export default Plan;