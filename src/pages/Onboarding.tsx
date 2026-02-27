import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, User, Briefcase, LogOut, Target, Zap, CheckCircle2 } from 'lucide-react';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';
import { isExecutiveProfile, StrategicPlanningData, StrategicPlanContext } from '@/lib/executiveDetection';
import { UnifiedProjectStep } from '@/components/UnifiedProjectStep';
import { UnifiedStrategicContext } from '@/components/UnifiedStrategicContext';
import { type StrategicContextProfile } from '@/lib/strategicDiscovery';
import { DevPanel } from '@/components/DevPanel';
import { 
  professionConfig, 
  type Profession, 
  getToneProfile,
  getTonedCopy,
} from '@/lib/adaptiveOnboarding';
import { useStrategicAccess, markStrategicTrialUsed } from '@/hooks/useStrategicAccess';

interface OnboardingData {
  fullName: string;
  profession: Profession | '';
  professionDetails: Record<string, any>;
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
  noDeadline: boolean;
  strategicPlanning: StrategicPlanningData;
  strategicModeChoice: 'standard' | 'strategic';
  strategicPlanContext: StrategicPlanContext;
}

/**
 * Streamlined Onboarding Flow:
 * Step 1: Identity + Profession (merged)
 * Step 2: Project Context (Title + Description + Deadline) with embedded strategic toggle
 * Step 3: Generate Plan (Standard) — done
 * Step 3 (Strategic): Unified Strategic Context (single adaptive screen)
 * Step 4 (Strategic): Generate Plan
 * 
 * Profession-specific questions are DEFERRED to post-plan via DeferredProfileCard
 */
const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    profession: '',
    professionDetails: {},
    projectTitle: '',
    projectDescription: '',
    projectDeadline: '',
    noDeadline: false,
    strategicPlanning: {},
    strategicModeChoice: 'standard',
    strategicPlanContext: { strategic_mode: false },
  });
  const [loading, setLoading] = useState(false);
  const { saveProfile, logout, user } = useAuth();
  const navigate = useNavigate();
  const { level } = useStrategicAccess();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isStrategic = data.strategicModeChoice === 'strategic';
  const showExecutiveStrategicPlanning = isExecutiveProfile(data.profession, data.professionDetails);

  // Total steps: Standard = 3, Strategic = 4
  const totalSteps = isStrategic ? 4 : 3;
  const progress = (step / totalSteps) * 100;

  const canProceed = () => {
    if (step === 1) return data.fullName.trim().length > 0 && data.profession !== '';
    if (step === 2) return data.projectTitle.trim().length > 0 && data.projectDescription.trim().length > 0 && (data.noDeadline || data.projectDeadline !== '');
    if (step === 3 && isStrategic) return true; // Strategic context is optional
    return true;
  };

  const handleNext = () => {
    if (canProceed()) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleStrategicToggle = async () => {
    if (isStrategic) {
      setData(prev => ({
        ...prev,
        strategicModeChoice: 'standard',
        strategicPlanContext: { strategic_mode: false },
      }));
    } else {
      if (level === 'none') return;
      if (level === 'preview' && user?.id) {
        await markStrategicTrialUsed(user.id);
      }
      setData(prev => ({
        ...prev,
        strategicModeChoice: 'strategic',
        strategicPlanContext: { strategic_mode: true },
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const processedDetails: Record<string, any> = { 
        ...data.professionDetails, 
        noDeadline: data.noDeadline,
        ...(showExecutiveStrategicPlanning && Object.keys(data.strategicPlanning).length > 0 
          ? { strategicPlanning: data.strategicPlanning } 
          : {}),
        ...(isStrategic 
          ? { plan_context: { ...data.strategicPlanContext, strategic_mode: true } } 
          : { plan_context: null }),
      };
      
      await saveProfile({
        fullName: data.fullName,
        profession: data.profession,
        professionDetails: processedDetails,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        projectDeadline: data.noDeadline ? null : data.projectDeadline,
      });
      
      toast.success('Profile saved! Generating your plan...');
      
      const { data: planData, error: planError } = await supabase.functions.invoke('generate-plan', {
        body: { 
          profile: {
            fullName: data.fullName,
            profession: data.profession,
            professionDetails: processedDetails,
            projectTitle: data.projectTitle,
            projectDescription: data.projectDescription,
            projectDeadline: data.noDeadline ? null : data.projectDeadline,
            noDeadline: data.noDeadline,
            strategicPlanning: showExecutiveStrategicPlanning ? data.strategicPlanning : undefined,
          }
        },
      });

      if (planError) {
        const errorBody = planError.message || '';
        if (errorBody.includes('STRATEGIC_ACCESS_EXHAUSTED') || planError.context?.status === 403) {
          toast.error('Strategic Planning requires a subscription. Redirecting to pricing...');
          setTimeout(() => navigate('/pricing'), 2000);
          setLoading(false);
          return;
        }
        console.error('Plan generation error:', planError);
        toast.error('Plan generation failed. Please try again.');
        setLoading(false);
        return;
      }

      toast.success('Your plan is ready!');
      navigate('/plan');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      if (error?.message?.includes('STRATEGIC_ACCESS_EXHAUSTED')) {
        toast.error('Strategic Planning requires a subscription. Redirecting to pricing...');
        setTimeout(() => navigate('/pricing'), 2000);
        setLoading(false);
        return;
      }
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === totalSteps;

  const renderStep = () => {
    // Step 1: Identity + Profession (merged)
    if (step === 1) {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Let's get started</h2>
            <p className="text-muted-foreground text-sm mt-1">Tell us about yourself</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={data.fullName}
              onChange={(e) => setData(prev => ({ ...prev, fullName: e.target.value }))}
              className="h-12"
              autoFocus
            />
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label>I work as a...</Label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(professionConfig) as [Profession, typeof professionConfig.software_engineer][]).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = data.profession === key;
                return (
                  <button
                    key={key}
                    onClick={() => setData(prev => ({ ...prev, profession: key, professionDetails: {} }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-primary bg-accent shadow-soft' 
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Unified Project Context with embedded strategic toggle
    if (step === 2) {
      const isStrategicDisabled = level === 'none';

      return (
        <UnifiedProjectStep
          projectTitle={data.projectTitle}
          projectDescription={data.projectDescription}
          projectDeadline={data.projectDeadline}
          noDeadline={data.noDeadline}
          profession={data.profession}
          onTitleChange={(v) => setData(prev => ({ ...prev, projectTitle: v }))}
          onDescriptionChange={(v) => setData(prev => ({ ...prev, projectDescription: v }))}
          onDeadlineChange={(v) => setData(prev => ({ ...prev, projectDeadline: v, noDeadline: false }))}
          onNoDeadlineChange={(checked) => setData(prev => ({ 
            ...prev, 
            noDeadline: checked,
            projectDeadline: checked ? '' : prev.projectDeadline 
          }))}
          strategicToggle={
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
          }
        />
      );
    }

    // Step 3 (Strategic): Unified Strategic Context
    if (step === 3 && isStrategic) {
      return (
        <UnifiedStrategicContext
          data={data.strategicPlanContext}
          onChange={(ctx) => setData(prev => ({ ...prev, strategicPlanContext: ctx }))}
          onDiscoveryComplete={(profile) => {
            if (profile) {
              setData(prev => ({
                ...prev,
                strategicPlanContext: {
                  ...prev.strategicPlanContext,
                  strategic_context_profile: profile,
                },
              }));
            }
          }}
          showDiscovery={true}
        />
      );
    }

    return null;
  };

  // Full-page loading overlay during plan generation
  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 animate-pulse-soft">
          <img src={kaamyabLogo} alt="Kamyaab" className="w-16 h-16 rounded-2xl object-contain" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Generating your execution plan…</h2>
        <p className="text-muted-foreground text-sm text-center">This may take a few seconds.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src={kaamyabLogo} alt="Kamyaab" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold tracking-[0.2em] uppercase text-foreground">Kamyaab</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="mb-6 h-2" />

        {/* Card */}
        <Card className="shadow-card border-border/50">
          <CardContent className="pt-6 pb-6">
            {renderStep()}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              <Button
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 h-12 gradient-kaamyab hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating Plan...
                  </>
                ) : isLastStep ? (
                  'Create My Plan'
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Terms Link */}
        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          By continuing, you agree to our{' '}
          <Link to="/terms" target="_blank" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </p>
        {/* Dev Panel */}
        <DevPanel
          pageId="onboarding"
          data={{
            step,
            totalSteps,
            progress,
            loading,
            profession: data.profession,
            strategicModeChoice: data.strategicModeChoice,
            strategicPlanContext: data.strategicPlanContext,
          }}
        />
      </div>
    </div>
  );
};

export default Onboarding;
