import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DevModeActivator } from '@/components/DevModeActivator';
import { 
  Rocket, Sparkles, Briefcase,
  Loader2, ArrowRight, ArrowLeft, Home, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { isExecutiveProfile, StrategicPlanningData, StrategicPlanContext } from '@/lib/executiveDetection';
import { UnifiedProjectStep } from '@/components/UnifiedProjectStep';
import { UnifiedStrategicContext } from '@/components/UnifiedStrategicContext';
import { type StrategicContextProfile } from '@/lib/strategicDiscovery';
import { 
  professionConfig, 
  type Profession, 
  getToneProfile,
} from '@/lib/adaptiveOnboarding';
import { useStrategicAccess, markStrategicTrialUsed } from '@/hooks/useStrategicAccess';
import { Target, CheckCircle2 } from 'lucide-react';

const stepVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
};

const stepTransition: Transition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

/**
 * Streamlined Plan Reset Flow:
 *
 * Same field: Step 1 (Project Context + strategic toggle) → Step 2 (Strategic, if enabled) → Generate
 * New field:  Step 1 (Profession) → Step 2 (Project Context + strategic toggle) → Step 3 (Strategic, if enabled) → Generate
 * 
 * Quick Generate: Change title, tap generate. Done.
 * Profession-specific questions are deferred to DeferredProfileCard on /home.
 */
const PlanReset = () => {
  const { profile, user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { level } = useStrategicAccess();

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };
  
  // Flow state — no more intent selection screen
  const [isNewField, setIsNewField] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [profession, setProfession] = useState<Profession | ''>('');
  const [professionDetails, setProfessionDetails] = useState<Record<string, any>>({});
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [noDeadline, setNoDeadline] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [strategicPlanning, setStrategicPlanning] = useState<StrategicPlanningData>({});

  // Strategic mode state
  const [isStrategic, setIsStrategic] = useState(false);
  const [strategicPlanContext, setStrategicPlanContext] = useState<StrategicPlanContext>({ strategic_mode: false });

  const showExecutiveStrategicPlanning = isExecutiveProfile(profession, professionDetails);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setProfession((profile.profession as Profession) || '');
      setProfessionDetails(profile.professionDetails as Record<string, any> || {});
      setProjectTitle(profile.projectTitle || '');
      setProjectDescription(profile.projectDescription || '');
      
      const profDetails = profile.professionDetails as { noDeadline?: boolean; strategicPlanning?: StrategicPlanningData; plan_context?: StrategicPlanContext } | null;
      if (profDetails?.noDeadline) {
        setNoDeadline(true);
      } else if (profile.projectDeadline) {
        setProjectDeadline(profile.projectDeadline);
      }
      
      if (profDetails?.strategicPlanning) {
        setStrategicPlanning(profDetails.strategicPlanning);
      }
      
      const existingPlanContext = profDetails?.plan_context as StrategicPlanContext | undefined;
      if (existingPlanContext?.strategic_mode) {
        setIsStrategic(true);
        setStrategicPlanContext(existingPlanContext);
      }
    }
  }, [profile]);

  // Check if user already has a plan - redirect if so
  useEffect(() => {
    const checkExistingPlan = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          navigate('/plan', { replace: true });
        }
      } catch (error) {
        console.error('Error checking plan:', error);
      } finally {
        setCheckingPlan(false);
      }
    };
    checkExistingPlan();
  }, [user, navigate]);

  // Calculate total steps
  const getTotalSteps = () => {
    if (isNewField) {
      // profession + project + (strategic if enabled)
      return isStrategic ? 3 : 2;
    }
    // project + (strategic if enabled)
    return isStrategic ? 2 : 1;
  };

  const totalSteps = getTotalSteps();
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  const canProceed = () => {
    if (isNewField && step === 1) return profession !== '';
    // Project context step
    const projectStep = isNewField ? 2 : 1;
    if (step === projectStep) {
      return projectTitle.trim().length > 0 && projectDescription.trim().length > 0 && (noDeadline || projectDeadline !== '');
    }
    // Strategic context step — optional
    return true;
  };

  const handleNext = () => {
    if (canProceed()) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 1 && isNewField) {
      setIsNewField(false);
      return;
    }
    if (step === 1) {
      navigate('/home');
      return;
    }
    setStep(prev => prev - 1);
  };

  const handleStrategicToggle = async () => {
    if (isStrategic) {
      setIsStrategic(false);
      setStrategicPlanContext({ strategic_mode: false });
    } else {
      if (level === 'none') return;
      if (level === 'preview' && user?.id) {
        await markStrategicTrialUsed(user.id);
      }
      setIsStrategic(true);
      setStrategicPlanContext({ strategic_mode: true });
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const processedDetails: Record<string, any> = { 
        ...professionDetails, 
        noDeadline,
        ...(showExecutiveStrategicPlanning && Object.keys(strategicPlanning).length > 0 
          ? { strategicPlanning } 
          : {}),
        plan_context: {
          strategic_mode: isStrategic,
          ...(isStrategic ? strategicPlanContext : {}),
        } as StrategicPlanContext,
      };
      
      // Combine custom technologies
      if (processedDetails.technologies_custom) {
        const custom = (processedDetails.technologies_custom as string).split(',').map((s: string) => s.trim()).filter((s: string) => s);
        processedDetails.technologies = [...(processedDetails.technologies || []), ...custom];
        delete processedDetails.technologies_custom;
      }
      if (processedDetails.tools_custom) {
        const custom = (processedDetails.tools_custom as string).split(',').map((s: string) => s.trim()).filter((s: string) => s);
        processedDetails.tools = [...(processedDetails.tools || []), ...custom];
        delete processedDetails.tools_custom;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          profession: profession,
          profession_details: processedDetails,
          project_title: projectTitle,
          project_description: projectDescription,
          project_deadline: noDeadline ? null : projectDeadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      await refreshProfile();

      // Generate new plan
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { 
          profile: {
            fullName: profile?.fullName,
            profession,
            professionDetails: processedDetails,
            projectTitle,
            projectDescription,
            projectDeadline: noDeadline ? null : projectDeadline,
            noDeadline,
            strategicPlanning: showExecutiveStrategicPlanning ? strategicPlanning : undefined,
          }
        },
      });

      if (error) {
        const errorBody = error.message || '';
        if (errorBody.includes('STRATEGIC_ACCESS_EXHAUSTED') || error.context?.status === 403) {
          toast({
            title: "Strategic Planning Locked",
            description: "Upgrade to Pro for unlimited strategic planning.",
            variant: "default",
          });
          setTimeout(() => navigate('/pricing'), 2000);
          return;
        }
        throw error;
      }

      toast({
        title: "Plan generated!",
        description: "Your new productivity plan is ready.",
      });
      navigate('/plan');
    } catch (error: any) {
      console.error('Error generating plan:', error);
      if (error?.message?.includes('STRATEGIC_ACCESS_EXHAUSTED')) {
        toast({
          title: "Strategic Planning Locked",
          description: "Upgrade to Pro for unlimited strategic planning.",
          variant: "default",
        });
        setTimeout(() => navigate('/pricing'), 2000);
        return;
      }
      toast({
        title: "Generation failed",
        description: "Could not generate your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (checkingPlan) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStrategicDisabled = level === 'none';

  const strategicToggleElement = (
    <div className="pt-4 border-t border-border/30">
      <button
        onClick={handleStrategicToggle}
        disabled={isStrategicDisabled}
        className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left ${
          isStrategicDisabled
            ? 'opacity-50 cursor-not-allowed border-border/30'
            : isStrategic
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-primary/30'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isStrategic ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <Target className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">Add strategic context</p>
            {isStrategic && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {isStrategicDisabled 
              ? 'Complete a plan to unlock' 
              : 'Include role, scope, constraints, and AI discovery'}
          </p>
        </div>
      </button>
    </div>
  );

  const renderStep = () => {
    // New field flow: Step 1 = Profession selection
    if (isNewField && step === 1) {
      return (
        <motion.div 
          key="profession-step"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <Briefcase className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-foreground">What's your new field?</h2>
            <p className="text-sm text-muted-foreground">Select your profession</p>
          </div>
          <div className="grid gap-2">
            {(Object.entries(professionConfig) as [Profession, typeof professionConfig.software_engineer][]).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = profession === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => {
                    setProfession(key);
                    setProfessionDetails({});
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-soft' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      );
    }

    // Project context step
    const projectStep = isNewField ? 2 : 1;
    if (step === projectStep) {
      const profileSummary = !isNewField && profession ? (
        <motion.div 
          className="bg-secondary/30 p-3 rounded-xl space-y-1 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span>Current: {professionConfig[profession]?.label || profession}</span>
            <button 
              onClick={() => { setIsNewField(true); setStep(1); }}
              className="text-primary text-xs hover:underline ml-auto"
            >
              Change field
            </button>
          </div>
        </motion.div>
      ) : undefined;

      return (
        <motion.div
          key="project-step"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <UnifiedProjectStep
            projectTitle={projectTitle}
            projectDescription={projectDescription}
            projectDeadline={projectDeadline}
            noDeadline={noDeadline}
            profession={profession}
            onTitleChange={setProjectTitle}
            onDescriptionChange={setProjectDescription}
            onDeadlineChange={(v) => { setProjectDeadline(v); setNoDeadline(false); }}
            onNoDeadlineChange={(checked) => { setNoDeadline(checked); if (checked) setProjectDeadline(''); }}
            profileSummary={profileSummary}
            strategicToggle={strategicToggleElement}
          />
        </motion.div>
      );
    }

    // Strategic context step
    const strategicStep = isNewField ? 3 : 2;
    if (isStrategic && step === strategicStep) {
      return (
        <motion.div
          key="strategic-step"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <UnifiedStrategicContext
            data={strategicPlanContext}
            onChange={setStrategicPlanContext}
            onDiscoveryComplete={(profile) => {
              if (profile) {
                setStrategicPlanContext(prev => ({
                  ...prev,
                  strategic_context_profile: profile,
                }));
              }
            }}
            showDiscovery={true}
          />
        </motion.div>
      );
    }

    return null;
  };

  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Kaamyab</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="btn-press text-muted-foreground hover:text-foreground"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <DevModeActivator>
              <ThemeToggle />
            </DevModeActivator>
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="btn-press text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave plan creation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All progress in this setup will be lost. When you log back in, you'll return to this page to create your plan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8">
        <Card className="glass-card border-0 shadow-elevated overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <motion.div 
              className="flex gap-3 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 glass border-border/50"
                disabled={isGenerating}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={isLastStep ? handleGenerate : handleNext}
                disabled={!canProceed() || isGenerating}
                className="flex-1 h-12 gradient-kaamyab hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : isLastStep ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create My Plan
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlanReset;
