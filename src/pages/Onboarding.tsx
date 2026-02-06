import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Rocket, User, Briefcase, Calendar, FileText, Bot, SkipForward, LogOut } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { isExecutiveProfile, StrategicPlanningData, StrategicPlanContext } from '@/lib/executiveDetection';
import { StrategicPlanningSection } from '@/components/StrategicPlanningSection';
import { AdaptivePlanningToggle } from '@/components/AdaptivePlanningToggle';
import { StrategicPlanningSteps, STRATEGIC_STEPS_COUNT } from '@/components/StrategicPlanningSteps';
import { StrategicDiscoveryFlow } from '@/components/StrategicDiscoveryFlow';
import { type StrategicContextProfile } from '@/lib/strategicDiscovery';
import { DevPanel } from '@/components/DevPanel';
import { 
  professionConfig, 
  type Profession, 
  type Question,
  getToneProfile,
  getTonedCopy,
  shouldShowPlanningApproachSelector,
  getFilteredQuestions,
} from '@/lib/adaptiveOnboarding';

interface OnboardingData {
  fullName: string;
  profession: Profession | '';
  professionDetails: Record<string, any>;
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
  noDeadline: boolean;
  strategicPlanning: StrategicPlanningData;
  // New: Strategic planning mode for all users
  strategicModeChoice: 'standard' | 'strategic';
  strategicPlanContext: StrategicPlanContext;
}

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
  // Phase 8.10: Strategic Discovery state
  const [discoveryCompleted, setDiscoveryCompleted] = useState(false);
  const { saveProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Check if user is executive profile (for existing collapsible section)
  const showExecutiveStrategicPlanning = isExecutiveProfile(data.profession, data.professionDetails);

  const profession = data.profession ? professionConfig[data.profession] : null;
  
  // Calculate filtered profession questions
  const professionQuestions = profession?.questions.filter(q => {
    if (!q.showIf) return true;
    return Object.entries(q.showIf).every(([key, value]) => data.professionDetails[key] === value);
  }) || [];
  
  // Calculate strategic steps count (only if strategic mode is selected)
  const strategicStepsCount = data.strategicModeChoice === 'strategic' ? STRATEGIC_STEPS_COUNT : 0;
  
  // Discovery step (only for strategic mode) - Phase 8.10
  const discoveryStep = data.strategicModeChoice === 'strategic' ? 1 : 0;
  
  // Total steps: 
  // 1 (name) + 1 (profession) + 1 (strategic toggle) + discovery (if strategic) + strategicSteps + professionQuestions + 3 (project steps)
  const totalSteps = 3 + discoveryStep + strategicStepsCount + professionQuestions.length + 3;
  const progress = (step / totalSteps) * 100;

  const updateProfessionDetail = (key: string, value: any) => {
    setData(prev => ({
      ...prev,
      professionDetails: { ...prev.professionDetails, [key]: value },
    }));
  };

  const toggleChip = (key: string, chip: string) => {
    const current = data.professionDetails[key] || [];
    const updated = current.includes(chip) 
      ? current.filter((c: string) => c !== chip)
      : [...current, chip];
    updateProfessionDetail(key, updated);
  };

  const updateCustomTech = (key: string, value: string) => {
    updateProfessionDetail(`${key}_custom`, value);
  };

  // Combine predefined and custom technologies into one array
  const getCombinedChips = (key: string): string[] => {
    const predefined = data.professionDetails[key] || [];
    const customRaw = data.professionDetails[`${key}_custom`] || '';
    
    if (!customRaw.trim()) return predefined;
    
    const customItems = customRaw
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
    
    // Combine and deduplicate (case-insensitive)
    const combined = [...predefined];
    const lowerCasePredefined = predefined.map((p: string) => p.toLowerCase());
    
    customItems.forEach((item: string) => {
      if (!lowerCasePredefined.includes(item.toLowerCase())) {
        combined.push(item);
      }
    });
    
    return combined;
  };

  // Get the current step type and index
  const getStepInfo = () => {
    if (step === 1) return { type: 'name', index: 0 };
    if (step === 2) return { type: 'profession', index: 0 };
    if (step === 3) return { type: 'strategicToggle', index: 0 };
    
    let currentStep = step - 3; // After toggle
    
    // Discovery step (if strategic mode) - Phase 8.10
    if (data.strategicModeChoice === 'strategic' && currentStep === 1) {
      return { type: 'discovery', index: 0 };
    }
    if (data.strategicModeChoice === 'strategic') {
      currentStep -= 1; // Account for discovery step
    }
    
    // Strategic steps (if enabled)
    if (data.strategicModeChoice === 'strategic' && currentStep <= STRATEGIC_STEPS_COUNT) {
      return { type: 'strategicStep', index: currentStep };
    }
    currentStep -= strategicStepsCount;
    
    // Profession questions
    if (currentStep <= professionQuestions.length) {
      return { type: 'professionQuestion', index: currentStep - 1 };
    }
    currentStep -= professionQuestions.length;
    
    // Project steps
    return { type: 'projectStep', index: currentStep };
  };

  const canProceed = () => {
    const { type, index } = getStepInfo();
    
    if (type === 'name') return data.fullName.trim().length > 0;
    if (type === 'profession') return data.profession !== '';
    if (type === 'strategicToggle') return true; // Always can proceed (default selected)
    if (type === 'discovery') return true; // Discovery is optional
    if (type === 'strategicStep') return true; // All strategic steps are optional
    
    if (type === 'professionQuestion') {
      const question = professionQuestions[index];
      if (!question) return true;
      if (question.type === 'text' && (question.label.includes('Optional') || question.key === 'aiToolsList')) return true;
      if (question.type === 'boolean') return data.professionDetails[question.key] !== undefined;
      if (question.type === 'chips') {
        const predefined = data.professionDetails[question.key] || [];
        const customRaw = data.professionDetails[`${question.key}_custom`] || '';
        const customItems = customRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        return predefined.length > 0 || customItems.length > 0;
      }
      return data.professionDetails[question.key];
    }
    
    if (type === 'projectStep') {
      if (index === 1) return data.projectTitle.trim().length > 0;
      if (index === 2) return data.projectDescription.trim().length > 0;
      if (index === 3) return data.noDeadline || data.projectDeadline !== '';
    }
    
    return true;
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    // Skip current step and move to next
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Process profession details to combine predefined and custom technologies
      const processedDetails: Record<string, any> = { 
        ...data.professionDetails, 
        noDeadline: data.noDeadline,
        // Include executive strategic planning data if available
        ...(showExecutiveStrategicPlanning && Object.keys(data.strategicPlanning).length > 0 
          ? { strategicPlanning: data.strategicPlanning } 
          : {}),
        // Include new strategic plan context if strategic mode was selected
        ...(data.strategicModeChoice === 'strategic' 
          ? { plan_context: { ...data.strategicPlanContext, strategic_mode: true } } 
          : { plan_context: null }),
      };
      
      // Combine technologies if present
      if (processedDetails.technologies !== undefined || processedDetails.technologies_custom) {
        processedDetails.technologies = getCombinedChips('technologies');
        delete processedDetails.technologies_custom;
      }
      
      // Combine tools if present (for freelancers)
      if (processedDetails.tools !== undefined || processedDetails.tools_custom) {
        processedDetails.tools = getCombinedChips('tools');
        delete processedDetails.tools_custom;
      }
      
      // Save the profile first
      await saveProfile({
        fullName: data.fullName,
        profession: data.profession,
        professionDetails: processedDetails,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        projectDeadline: data.noDeadline ? null : data.projectDeadline,
      });
      
      toast.success('Profile saved! Generating your plan...');
      
      // Generate the plan immediately for first-time users
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
        console.error('Plan generation error:', planError);
        toast.error('Plan generation failed. Please try again.');
        setLoading(false);
        return;
      }

      toast.success('Your plan is ready!');
      navigate('/plan');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const { type, index } = getStepInfo();

    // Step 1: Full Name
    if (type === 'name') {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">What's your name?</h2>
            <p className="text-muted-foreground text-sm mt-1">Let's personalize your experience</p>
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={data.fullName}
              onChange={(e) => setData(prev => ({ ...prev, fullName: e.target.value }))}
              className="mt-2 h-12"
              autoFocus
            />
          </div>
        </div>
      );
    }

    // Step 2: Profession Selection
    if (type === 'profession') {
      const tone = data.profession ? getToneProfile(data.profession as Profession) : 'casual';
      
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{getTonedCopy('whatDoYouDo', tone)}</h2>
            <p className="text-muted-foreground text-sm mt-1">{getTonedCopy('customizeExperience', tone)}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(Object.entries(professionConfig) as [Profession, typeof professionConfig.software_engineer][]).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = data.profession === key;
              return (
                <button
                  key={key}
                  onClick={() => setData(prev => ({ ...prev, profession: key, professionDetails: {} }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-primary bg-accent shadow-soft' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Step 3: Strategic Planning Toggle
    if (type === 'strategicToggle') {
      // Use intent-based labels for 'Other' profession
      const showIntentLabels = shouldShowPlanningApproachSelector(data.profession as Profession);
      
      return (
        <AdaptivePlanningToggle
          value={data.strategicModeChoice}
          onChange={(value) => setData(prev => ({ 
            ...prev, 
            strategicModeChoice: value,
            strategicPlanContext: value === 'strategic' 
              ? { strategic_mode: true } 
              : { strategic_mode: false }
          }))}
          profession={data.profession as Profession}
          showIntentLabels={showIntentLabels}
        />
      );
    }

    // Strategic Discovery Step (Phase 8.10) - only for strategic mode
    if (type === 'discovery') {
      const handleDiscoveryComplete = (profile: StrategicContextProfile | null) => {
        setDiscoveryCompleted(true);
        if (profile) {
          setData(prev => ({
            ...prev,
            strategicPlanContext: {
              ...prev.strategicPlanContext,
              strategic_context_profile: profile,
            },
          }));
        }
        handleNext();
      };
      
      const handleDiscoverySkip = () => {
        setDiscoveryCompleted(true);
        handleNext();
      };
      
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">Help us understand your context</h2>
            <p className="text-muted-foreground text-sm mt-1">
              A few quick questions to tailor your strategic plan
            </p>
          </div>
          <StrategicDiscoveryFlow
            onComplete={handleDiscoveryComplete}
            onSkip={handleDiscoverySkip}
          />
        </div>
      );
    }

    // Strategic Planning Steps (if strategic mode selected)
    if (type === 'strategicStep') {
      return (
        <StrategicPlanningSteps
          currentStep={index}
          data={data.strategicPlanContext}
          onChange={(context) => setData(prev => ({ ...prev, strategicPlanContext: context }))}
        />
      );
    }

    // Profession-specific questions
    if (type === 'professionQuestion') {
      const question = professionQuestions[index];
      if (!question) return null;
      const Icon = profession?.icon || Briefcase;

      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{question.label}</h2>
          </div>

          {question.type === 'select' && (
            <Select
              value={data.professionDetails[question.key] || ''}
              onValueChange={(value) => updateProfessionDetail(question.key, value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder={`Select ${question.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {question.type === 'text' && (
            <div className="space-y-2">
              <Input
                placeholder={question.placeholder || (question.key === 'aiToolsList' 
                  ? "e.g., ChatGPT, Cursor, Copilot, custom agents"
                  : `Enter ${question.label.toLowerCase()}`)}
                value={data.professionDetails[question.key] || ''}
                onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
                className="h-12"
                autoFocus
              />
              {(question.helpText || question.key === 'aiToolsList') && (
                <p className="text-xs text-muted-foreground">
                  {question.helpText || 'You can list multiple tools separated by commas'}
                </p>
              )}
            </div>
          )}

          {question.type === 'textarea' && (
            <div className="space-y-2">
              <Textarea
                placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`}
                value={data.professionDetails[question.key] || ''}
                onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
                className="min-h-[120px]"
                autoFocus
              />
              {question.helpText && (
                <p className="text-xs text-muted-foreground">
                  {question.helpText}
                </p>
              )}
            </div>
          )}

          {question.type === 'boolean' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateProfessionDetail(question.key, 'yes')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    data.professionDetails[question.key] === 'yes'
                      ? 'border-primary bg-accent shadow-soft'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <Bot className="w-5 h-5" />
                  <span className="font-medium">Yes</span>
                </button>
                <button
                  onClick={() => updateProfessionDetail(question.key, 'no')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    data.professionDetails[question.key] === 'no'
                      ? 'border-primary bg-accent shadow-soft'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <span className="font-medium">No</span>
                </button>
              </div>
            </div>
          )}

          {question.type === 'chips' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {question.options?.map((option) => {
                  const selected = (data.professionDetails[question.key] || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => toggleChip(question.key, option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selected
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {question.key === 'technologies' && (
                <div className="pt-2">
                  <Label htmlFor="customTech" className="text-sm text-muted-foreground">
                    Other technologies (optional)
                  </Label>
                  <Input
                    id="customTech"
                    placeholder="e.g. Rust, Go, WebAssembly, Three.js"
                    value={data.professionDetails[`${question.key}_custom`] || ''}
                    onChange={(e) => updateCustomTech(question.key, e.target.value)}
                    className="mt-2 h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If your technology isn't listed, add it here (comma-separated)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Project questions
    if (type === 'projectStep') {
      const tone = data.profession ? getToneProfile(data.profession as Profession) : 'casual';
      
      if (index === 1) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Project Title</h2>
              <p className="text-muted-foreground text-sm mt-1">{getTonedCopy('projectTitle', tone)}</p>
            </div>
            <Input
              placeholder="e.g., Launch my e-commerce store"
              value={data.projectTitle}
              onChange={(e) => setData(prev => ({ ...prev, projectTitle: e.target.value }))}
              className="h-12"
              autoFocus
            />
          </div>
        );
      }

      if (index === 2) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Project Description</h2>
              <p className="text-muted-foreground text-sm mt-1">{getTonedCopy('projectDescription', tone)}</p>
            </div>
            <Textarea
              placeholder={getTonedCopy('projectDescriptionPlaceholder', tone)}
              value={data.projectDescription}
              onChange={(e) => setData(prev => ({ ...prev, projectDescription: e.target.value }))}
              className="min-h-[150px]"
              autoFocus
            />
          </div>
        );
      }

      if (index === 3) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Project Deadline</h2>
              <p className="text-muted-foreground text-sm mt-1">{getTonedCopy('projectDeadline', tone)}</p>
            </div>
            <Input
              type="date"
              value={data.projectDeadline}
              onChange={(e) => setData(prev => ({ ...prev, projectDeadline: e.target.value, noDeadline: false }))}
              className="h-12"
              min={new Date().toISOString().split('T')[0]}
              disabled={data.noDeadline}
            />
            <div className="flex items-center space-x-3 pt-2">
              <Checkbox
                id="noDeadline"
                checked={data.noDeadline}
                onCheckedChange={(checked) => 
                  setData(prev => ({ 
                    ...prev, 
                    noDeadline: checked === true,
                    projectDeadline: checked === true ? '' : prev.projectDeadline 
                  }))
                }
              />
              <label
                htmlFor="noDeadline"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                {getTonedCopy('noDeadlineLabel', tone)}
              </label>
            </div>
            {data.noDeadline && (
              <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                {getTonedCopy('noDeadlineHint', tone)}
              </p>
            )}

            {/* Strategic Planning Section for Executives (existing collapsible) */}
            {showExecutiveStrategicPlanning && (
              <div className="pt-4">
                <StrategicPlanningSection
                  data={data.strategicPlanning}
                  onChange={(strategicPlanning) => setData(prev => ({ ...prev, strategicPlanning }))}
                />
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  const { type } = getStepInfo();
  const isLastStep = step === totalSteps;
  const isStrategicStep = type === 'strategicStep';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Kaamyab</span>
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
              
              {/* Skip button for strategic steps */}
              {isStrategicStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="h-12 text-muted-foreground"
                  disabled={loading}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
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
                  'Complete Setup'
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
            professionDetails: data.professionDetails,
            projectTitle: data.projectTitle,
            noDeadline: data.noDeadline,
            showExecutiveStrategicPlanning,
            strategicModeChoice: data.strategicModeChoice,
            strategicPlanContext: data.strategicPlanContext,
          }}
        />
      </div>
    </div>
  );
};

export default Onboarding;
