import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DevModeActivator } from '@/components/DevModeActivator';
import { 
  Rocket, Sparkles, CalendarIcon, Briefcase, Code, Bot, 
  Loader2, ArrowRight, ArrowLeft, Home, RefreshCw, Shuffle,
  User, GraduationCap, Store, Video, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { isExecutiveProfile, StrategicPlanningData, StrategicPlanContext } from '@/lib/executiveDetection';
import { StrategicPlanningSection } from '@/components/StrategicPlanningSection';
import { StrategicPlanningToggle } from '@/components/StrategicPlanningToggle';
import { StrategicPlanningSteps, STRATEGIC_STEPS_COUNT } from '@/components/StrategicPlanningSteps';
import { PlanningGuidanceHint } from '@/components/PlanningGuidanceHint';
import { NextCycleGuidance } from '@/components/NextCycleGuidance';
import { ScenarioTagSelector } from '@/components/ScenarioTagSelector';
import { StrategicDiscoveryFlow } from '@/components/StrategicDiscoveryFlow';
import { type ScenarioTag } from '@/lib/scenarioMemory';
import { type StrategicContextProfile } from '@/lib/strategicDiscovery';
import { fetchExecutionProfile, type PersonalExecutionProfile } from '@/lib/personalExecutionProfile';

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

type Profession = 'software_engineer' | 'freelancer' | 'student' | 'business_owner' | 'content_creator';
type IntentType = 'same_field' | 'new_field' | null;

interface Question {
  key: string;
  label: string;
  type: string;
  options?: string[];
  showIf?: Record<string, string>;
}

const professionConfig: Record<string, { label: string; icon: typeof Code; questions: Question[] }> = {
  software_engineer: {
    label: 'Software Engineer',
    icon: Code,
    questions: [
      { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['Company', 'Freelancing'] },
      { key: 'level', label: 'Level', type: 'select', options: ['Junior', 'Mid', 'Senior'], showIf: { employmentType: 'Company' } },
      { key: 'stack', label: 'Stack', type: 'select', options: ['Full-stack', 'Front-end', 'Back-end'], showIf: { employmentType: 'Freelancing' } },
      { key: 'technologies', label: 'Technologies', type: 'chips', options: ['React', 'Next.js', 'Node.js', 'Python', 'PHP', 'Flutter', 'TypeScript', 'Vue.js'] },
      { key: 'aiToolsUsed', label: 'Do you use AI tools?', type: 'boolean' },
      { key: 'aiToolsList', label: 'AI Tools', type: 'text', showIf: { aiToolsUsed: 'yes' } },
    ],
  },
  freelancer: {
    label: 'Freelancer',
    icon: Palette,
    questions: [
      { key: 'freelancerType', label: 'Freelancer Type', type: 'select', options: ['Web Development', 'Mobile Development', 'Graphics Design', 'UI/UX Design'] },
      { key: 'tools', label: 'Tools & Technologies', type: 'chips', options: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'React', 'WordPress', 'Shopify'] },
    ],
  },
  student: {
    label: 'Student',
    icon: GraduationCap,
    questions: [
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'select', options: ['Computer Science', 'Information Technology', 'Business', 'Engineering', 'Other'] },
      { key: 'semester', label: 'Semester/Year', type: 'text' },
    ],
  },
  business_owner: {
    label: 'Business Owner',
    icon: Store,
    questions: [
      { key: 'platform', label: 'Primary Platform', type: 'select', options: ['Shopify', 'Social Media', 'Own Website', 'Marketplace'] },
      { key: 'productCategory', label: 'Product Category', type: 'select', options: ['Clothing', 'Jewelry', 'Digital Products', 'Food & Beverages', 'Other'] },
    ],
  },
  content_creator: {
    label: 'Content Creator',
    icon: Video,
    questions: [
      { key: 'platform', label: 'Primary Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'LinkedIn', 'Multiple'] },
      { key: 'niche', label: 'Content Niche', type: 'select', options: ['Tech', 'Vlog', 'Education', 'Entertainment', 'Business', 'Other'] },
    ],
  },
};

const PlanReset = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Flow state
  const [intent, setIntent] = useState<IntentType>(null);
  const [step, setStep] = useState(0); // 0 = intent selection
  
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
  const [personalProfile, setPersonalProfile] = useState<PersonalExecutionProfile | null>(null);

  // NEW: Phase 8.1 Planning Mode state
  const [planningModeChoice, setPlanningModeChoice] = useState<'standard' | 'strategic'>('standard');
  const [strategicPlanContext, setStrategicPlanContext] = useState<StrategicPlanContext>({ strategic_mode: false });
  const [strategicStep, setStrategicStep] = useState(0); // 0 = not in strategic steps, 1-5 = strategic steps
  
  // Phase 8.9: Scenario Memory state
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTag>(null);
  
  // Phase 8.10: Strategic Discovery state
  const [strategicContextProfile, setStrategicContextProfile] = useState<StrategicContextProfile | null>(null);
  const [discoveryCompleted, setDiscoveryCompleted] = useState(false);

  // Check if current profile is executive (legacy)
  const showStrategicPlanning = isExecutiveProfile(profession, professionDetails);
  
  // Check if strategic mode was enabled in current plan context
  const isStrategicModeSelected = planningModeChoice === 'strategic';
  
  // Load personal execution profile for guidance hints
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profile = await fetchExecutionProfile(user.id);
        setPersonalProfile(profile);
      }
    };
    loadProfile();
  }, [user]);

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
      
      // Load existing strategic planning data (legacy)
      if (profDetails?.strategicPlanning) {
        setStrategicPlanning(profDetails.strategicPlanning);
      }
      
      // Load existing Phase 8.1 strategic plan context
      const existingPlanContext = profDetails?.plan_context as StrategicPlanContext | undefined;
      if (existingPlanContext?.strategic_mode) {
        setPlanningModeChoice('strategic');
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

  // Get filtered profession questions
  const professionQuestions = profession ? professionConfig[profession]?.questions.filter(q => {
    if (!q.showIf) return true;
    return Object.entries(q.showIf).every(([key, value]) => professionDetails[key] === value);
  }) || [] : [];

  // Calculate total steps based on intent and planning mode
  const getTotalSteps = () => {
    // Planning mode toggle is step 1 for both flows
    const planningModeStep = 1;
    // Discovery step is step 2 (Phase 8.10) - only for strategic mode
    const discoveryStep = isStrategicModeSelected ? 1 : 0;
    // Scenario step (Phase 8.9)
    const scenarioStep = 1;
    // Strategic steps only if strategic mode selected
    const strategicStepsCount = isStrategicModeSelected ? STRATEGIC_STEPS_COUNT : 0;
    
    if (intent === 'same_field') {
      // planning mode + discovery (if strategic) + scenario + strategic steps (if any) + project + deadline
      return planningModeStep + discoveryStep + scenarioStep + strategicStepsCount + 2;
    } else if (intent === 'new_field') {
      // planning mode + discovery (if strategic) + scenario + strategic steps (if any) + profession + questions + project + deadline
      return planningModeStep + discoveryStep + scenarioStep + strategicStepsCount + 1 + professionQuestions.length + 2;
    }
    return 0;
  };

  const totalSteps = getTotalSteps();
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  const updateProfessionDetail = (key: string, value: any) => {
    setProfessionDetails(prev => ({ ...prev, [key]: value }));
  };

  const toggleChip = (key: string, chip: string) => {
    const current = professionDetails[key] || [];
    const updated = current.includes(chip) 
      ? current.filter((c: string) => c !== chip)
      : [...current, chip];
    updateProfessionDetail(key, updated);
  };

  const handleIntentSelect = (selectedIntent: IntentType) => {
    setIntent(selectedIntent);
    if (selectedIntent === 'new_field') {
      // Reset profession-related fields for new field
      setProfession('');
      setProfessionDetails({});
    }
    setStep(1);
  };

  // Helper: Calculate step offsets based on planning mode
  const getStepOffsets = () => {
    const strategicStepsCount = isStrategicModeSelected ? STRATEGIC_STEPS_COUNT : 0;
    const hasDiscoveryStep = isStrategicModeSelected;
    
    // Step 1: Planning mode toggle
    // Step 2: Discovery (if strategic) OR Scenario (if standard)
    // Step 3: Scenario (if strategic) OR first content step (if standard)
    // etc.
    
    if (hasDiscoveryStep) {
      return {
        planningModeStep: 1,
        discoveryStep: 2, // Phase 8.10
        scenarioStep: 3, // Phase 8.9
        strategicStepsStart: 4,
        strategicStepsEnd: 3 + strategicStepsCount,
        afterStrategicSteps: 4 + strategicStepsCount, // First step after strategic steps
      };
    } else {
      return {
        planningModeStep: 1,
        discoveryStep: 0, // Not used
        scenarioStep: 2, // Phase 8.9
        strategicStepsStart: 3,
        strategicStepsEnd: 2 + strategicStepsCount,
        afterStrategicSteps: 3 + strategicStepsCount, // First step after strategic steps
      };
    }
  };

  const canProceed = () => {
    const offsets = getStepOffsets();
    
    // Step 1: Planning mode toggle - always can proceed
    if (step === 1) return true;
    
    // Step 2: Discovery step (Phase 8.10) if strategic, else Scenario step - always can proceed (optional)
    if (step === 2) return true;
    
    // Step 3: Scenario step (if strategic) - always can proceed (optional)
    if (isStrategicModeSelected && step === offsets.scenarioStep) return true;
    
    // Strategic steps: all optional
    if (isStrategicModeSelected && step >= offsets.strategicStepsStart && step <= offsets.strategicStepsEnd) {
      return true;
    }
    
    if (intent === 'same_field') {
      // After planning mode + strategic steps: project details, then deadline
      const projectStep = step - offsets.afterStrategicSteps + 1;
      if (projectStep === 1) return projectTitle.trim().length > 0 && projectDescription.trim().length > 0;
      if (projectStep === 2) return noDeadline || projectDeadline !== '';
    } else if (intent === 'new_field') {
      // After planning mode + strategic steps: profession, then questions, then project, then deadline
      const afterStrategic = step - offsets.afterStrategicSteps + 1;
      
      if (afterStrategic === 1) return profession !== '';
      
      const questionStep = afterStrategic - 2;
      if (questionStep >= 0 && questionStep < professionQuestions.length) {
        const question = professionQuestions[questionStep];
        if (question.type === 'text' && question.key === 'aiToolsList') return true;
        if (question.type === 'boolean') return professionDetails[question.key] !== undefined;
        if (question.type === 'chips') {
          const chips = professionDetails[question.key] || [];
          const customRaw = professionDetails[`${question.key}_custom`] || '';
          return chips.length > 0 || customRaw.trim().length > 0;
        }
        return professionDetails[question.key];
      }
      
      const projectStep = afterStrategic - 1 - professionQuestions.length;
      if (projectStep === 1) return projectTitle.trim().length > 0 && projectDescription.trim().length > 0;
      if (projectStep === 2) return noDeadline || projectDeadline !== '';
    }
    return true;
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      setIntent(null);
      setStep(0);
    } else {
      setStep(prev => prev - 1);
    }
  };
  
  const handlePlanningModeChange = (mode: 'standard' | 'strategic') => {
    setPlanningModeChoice(mode);
    if (mode === 'strategic') {
      setStrategicPlanContext({ strategic_mode: true });
    } else {
      // Clear strategic context when switching to standard
      setStrategicPlanContext({ strategic_mode: false });
    }
  };

  const handleGenerate = async () => {
    if (!user) return;

    setIsGenerating(true);

    try {
      // Process profession details
      const processedDetails: Record<string, any> = { 
        ...professionDetails, 
        noDeadline,
        // Include legacy strategic planning data if available (for executives)
        ...(showStrategicPlanning && Object.keys(strategicPlanning).length > 0 
          ? { strategicPlanning } 
          : {}),
        // Include Phase 8.1 strategic plan context + Phase 8.9 scenario
        plan_context: {
          strategic_mode: isStrategicModeSelected,
          ...(isStrategicModeSelected ? strategicPlanContext : {}),
          // Phase 8.9: Include scenario (immutable after plan creation)
          scenario: selectedScenario,
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
            strategicPlanning: showStrategicPlanning ? strategicPlanning : undefined,
          }
        },
      });

      if (error) throw error;

      toast({
        title: "Plan generated!",
        description: "Your new productivity plan is ready.",
      });

      navigate('/plan');
    } catch (error) {
      console.error('Error generating plan:', error);
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

  const renderIntentSelection = () => (
    <motion.div 
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={stepTransition}
    >
      {/* Next-Cycle Guidance - Show before new plan if user has history */}
      {user && personalProfile?.progress_history && personalProfile.progress_history.snapshots.length > 0 && (
        <NextCycleGuidance
          userId={user.id}
          showBeforeGeneration={true}
        />
      )}

      <div className="text-center">
        <motion.div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-kaamyab mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        >
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          What would you like to do?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose how you want to create your next plan
        </p>
      </div>

      <div className="grid gap-4 max-w-lg mx-auto">
        <motion.button
          onClick={() => handleIntentSelect('same_field')}
          className="flex items-center gap-4 p-6 rounded-2xl glass-card glass-card-hover border-2 border-transparent hover:border-primary/50 transition-all text-left group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <RefreshCw className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              Continue in the same field
            </h3>
            <p className="text-sm text-muted-foreground">
              Keep your profession & stack, update project details
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>

        <motion.button
          onClick={() => handleIntentSelect('new_field')}
          className="flex items-center gap-4 p-6 rounded-2xl glass-card glass-card-hover border-2 border-transparent hover:border-primary/50 transition-all text-left group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-14 h-14 rounded-xl bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
            <Shuffle className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              Start in a new field
            </h3>
            <p className="text-sm text-muted-foreground">
              Switch careers, change domain, fresh start
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Render planning mode toggle (Step 1 for both flows)
  const renderPlanningModeStep = () => (
    <motion.div 
      key="planning-mode-step"
      className="space-y-6"
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={stepTransition}
    >
      <StrategicPlanningToggle
        value={planningModeChoice}
        onChange={handlePlanningModeChange}
      />
    </motion.div>
  );

  // Render scenario step - Phase 8.9
  const renderScenarioStep = () => {
    const handleScenarioSelect = (tag: ScenarioTag) => {
      setSelectedScenario(tag);
      // Automatically advance after selection
      handleNext();
    };
    
    const handleScenarioSkip = () => {
      setSelectedScenario(null);
      handleNext();
    };
    
    return (
      <ScenarioTagSelector
        selected={selectedScenario}
        onSelect={handleScenarioSelect}
        onSkip={handleScenarioSkip}
      />
    );
  };

  // Render strategic discovery step - Phase 8.10
  const renderDiscoveryStep = () => {
    const handleDiscoveryComplete = (profile: StrategicContextProfile | null) => {
      setStrategicContextProfile(profile);
      setDiscoveryCompleted(true);
      // Store profile in strategic context
      if (profile) {
        setStrategicPlanContext(prev => ({
          ...prev,
          strategic_context_profile: profile,
        }));
      }
      handleNext();
    };
    
    const handleDiscoverySkip = () => {
      setDiscoveryCompleted(true);
      handleNext();
    };
    
    return (
      <motion.div 
        key="discovery-step"
        className="space-y-6"
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={stepTransition}
      >
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Help us understand your context</h2>
          <p className="text-sm text-muted-foreground mt-1">
            A few quick questions to tailor your strategic plan
          </p>
        </div>
        <StrategicDiscoveryFlow
          onComplete={handleDiscoveryComplete}
          onSkip={handleDiscoverySkip}
        />
      </motion.div>
    );
  };

  // Render strategic planning steps (Steps 4-8 if strategic mode selected)
  const renderStrategicStep = (stepNumber: number) => {
    const offsets = getStepOffsets();
    const strategicStepIndex = stepNumber - offsets.strategicStepsStart + 1; // 1-5
    
    return (
      <motion.div 
        key={`strategic-step-${strategicStepIndex}`}
        className="space-y-6"
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={stepTransition}
      >
        <StrategicPlanningSteps
          currentStep={strategicStepIndex}
          data={strategicPlanContext}
          onChange={setStrategicPlanContext}
        />
      </motion.div>
    );
  };

  const renderSameFieldFlow = () => {
    const offsets = getStepOffsets();
    
    // Step 1: Planning mode toggle
    if (step === 1) {
      return renderPlanningModeStep();
    }
    
    // Step 2: Discovery step (Phase 8.10) - only for strategic mode
    if (isStrategicModeSelected && step === offsets.discoveryStep) {
      return renderDiscoveryStep();
    }
    
    // Scenario selection (Phase 8.9)
    if (step === offsets.scenarioStep) {
      return renderScenarioStep();
    }
    
    // Strategic steps (if strategic mode)
    if (isStrategicModeSelected && step >= offsets.strategicStepsStart && step <= offsets.strategicStepsEnd) {
      return renderStrategicStep(step);
    }
    
    // After strategic steps: project details
    const afterStrategicStep = step - offsets.afterStrategicSteps + 1;
    
    if (afterStrategicStep === 1) {
      return (
        <motion.div 
          key="same-field-step-1"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-foreground">Update Project Details</h2>
            <p className="text-sm text-muted-foreground">Your profile stays the same</p>
          </div>

          {/* Current Profile Summary */}
          <motion.div 
            className="glass-subtle p-4 rounded-xl space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span>Current: {professionConfig[profession]?.label || profession}</span>
            </div>
            {professionDetails.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {professionDetails.technologies.slice(0, 5).map((tech: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {tech}
                  </span>
                ))}
                {professionDetails.technologies.length > 5 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                    +{professionDetails.technologies.length - 5} more
                  </span>
                )}
              </div>
            )}
          </motion.div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="What are you working on?"
                className="h-12 glass-subtle border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Project Description</Label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your goals and what success looks like..."
                rows={4}
                className="glass-subtle border-border/50 resize-none"
              />
            </div>
          </div>
        </motion.div>
      );
    }

    if (afterStrategicStep === 2) {
      return (
        <motion.div 
          key="same-field-step-2"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              <CalendarIcon className="w-10 h-10 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">Project Deadline</h2>
            <p className="text-sm text-muted-foreground">When do you want to complete this?</p>
          </div>

          <div className="space-y-4">
            <Input
              type="date"
              value={projectDeadline}
              onChange={(e) => {
                setProjectDeadline(e.target.value);
                setNoDeadline(false);
              }}
              min={new Date().toISOString().split('T')[0]}
              disabled={noDeadline}
              className="h-12 glass-subtle border-border/50"
            />

            <div className="flex items-center gap-3 p-4 glass-subtle rounded-xl">
              <Checkbox
                id="no-deadline"
                checked={noDeadline}
                onCheckedChange={(checked) => {
                  setNoDeadline(checked === true);
                  if (checked) setProjectDeadline('');
                }}
                className="border-primary/50 data-[state=checked]:bg-primary"
              />
              <label htmlFor="no-deadline" className="text-sm text-muted-foreground cursor-pointer flex-1">
                There is no deadline — focus on consistency
              </label>
            </div>

            {/* Strategic Planning Section for Executives */}
            {showStrategicPlanning && (
              <div className="pt-2">
                <StrategicPlanningSection
                  data={strategicPlanning}
                  onChange={setStrategicPlanning}
                />
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return null;
  };

  const renderNewFieldFlow = () => {
    const offsets = getStepOffsets();
    
    // Step 1: Planning mode toggle
    if (step === 1) {
      return renderPlanningModeStep();
    }
    
    // Step 2: Discovery step (Phase 8.10) - only for strategic mode
    if (isStrategicModeSelected && step === offsets.discoveryStep) {
      return renderDiscoveryStep();
    }
    
    // Scenario selection (Phase 8.9)
    if (step === offsets.scenarioStep) {
      return renderScenarioStep();
    }
    
    // Strategic steps (if strategic mode)
    if (isStrategicModeSelected && step >= offsets.strategicStepsStart && step <= offsets.strategicStepsEnd) {
      return renderStrategicStep(step);
    }
    
    // After strategic steps: profession, then questions, then project, then deadline
    const afterStrategicStep = step - offsets.afterStrategicSteps + 1;
    
    // Profession selection
    if (afterStrategicStep === 1) {
      return (
        <motion.div 
          key="new-field-profession"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              <Briefcase className="w-10 h-10 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">What's your new field?</h2>
            <p className="text-sm text-muted-foreground">Select your profession</p>
          </div>

          <div className="grid gap-3">
            {(Object.entries(professionConfig) as [Profession, typeof professionConfig.software_engineer][]).map(([key, config], index) => {
              const Icon = config.icon;
              const isSelected = profession === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => {
                    setProfession(key);
                    setProfessionDetails({});
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-soft' 
                      : 'border-border/50 glass-subtle hover:border-primary/50'
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      );
    }

    // Profession-specific questions
    const questionStep = afterStrategicStep - 2;
    if (questionStep >= 0 && questionStep < professionQuestions.length) {
      const question = professionQuestions[questionStep];
      const Icon = professionConfig[profession]?.icon || Briefcase;

      return (
        <motion.div 
          key={`new-field-question-${questionStep}`}
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">{question.label}</h2>
          </div>

          {question.type === 'select' && (
            <Select
              value={professionDetails[question.key] || ''}
              onValueChange={(value) => updateProfessionDetail(question.key, value)}
            >
              <SelectTrigger className="h-12 glass-subtle border-border/50">
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
            <Input
              placeholder={`Enter ${question.label.toLowerCase()}`}
              value={professionDetails[question.key] || ''}
              onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
              className="h-12 glass-subtle border-border/50"
            />
          )}

          {question.type === 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => updateProfessionDetail(question.key, 'yes')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  professionDetails[question.key] === 'yes'
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 glass-subtle hover:border-primary/50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Bot className="w-5 h-5" />
                <span className="font-medium">Yes</span>
              </motion.button>
              <motion.button
                onClick={() => updateProfessionDetail(question.key, 'no')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  professionDetails[question.key] === 'no'
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 glass-subtle hover:border-primary/50'
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="font-medium">No</span>
              </motion.button>
            </div>
          )}

          {question.type === 'chips' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {question.options?.map((option, index) => {
                  const selected = (professionDetails[question.key] || []).includes(option);
                  return (
                    <motion.button
                      key={option}
                      onClick={() => toggleChip(question.key, option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.03 * index, type: "spring", stiffness: 400 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Other (comma-separated)</Label>
                <Input
                  placeholder="e.g. Rust, Go, WebAssembly"
                  value={professionDetails[`${question.key}_custom`] || ''}
                  onChange={(e) => updateProfessionDetail(`${question.key}_custom`, e.target.value)}
                  className="h-12 glass-subtle border-border/50"
                />
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    // Project details
    const projectStep = afterStrategicStep - 1 - professionQuestions.length;
    if (projectStep === 1) {
      return (
        <motion.div 
          key="new-field-project"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">Project Details</h2>
            <p className="text-sm text-muted-foreground">What are you working on?</p>
          </div>

          {/* Personal Execution Guidance Hint */}
          <PlanningGuidanceHint
            profile={personalProfile}
            currentStep="project"
            formData={{ projectDescription, projectDeadline, noDeadline }}
            className="mb-2"
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g., Launch my portfolio website"
                className="h-12 glass-subtle border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Project Description</Label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your goals..."
                rows={4}
                className="glass-subtle border-border/50 resize-none"
              />
            </div>
          </div>
        </motion.div>
      );
    }

    if (projectStep === 2) {
      return (
        <motion.div 
          key="new-field-deadline"
          className="space-y-6"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={stepTransition}
        >
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              <CalendarIcon className="w-10 h-10 text-primary mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">Project Deadline</h2>
          </div>

          <div className="space-y-4">
            <Input
              type="date"
              value={projectDeadline}
              onChange={(e) => {
                setProjectDeadline(e.target.value);
                setNoDeadline(false);
              }}
              min={new Date().toISOString().split('T')[0]}
              disabled={noDeadline}
              className="h-12 glass-subtle border-border/50"
            />

            <div className="flex items-center gap-3 p-4 glass-subtle rounded-xl">
              <Checkbox
                id="no-deadline-new"
                checked={noDeadline}
                onCheckedChange={(checked) => {
                  setNoDeadline(checked === true);
                  if (checked) setProjectDeadline('');
                }}
                className="border-primary/50 data-[state=checked]:bg-primary"
              />
              <label htmlFor="no-deadline-new" className="text-sm text-muted-foreground cursor-pointer flex-1">
                There is no deadline
              </label>
            </div>

            {/* Strategic Planning Section for Executives */}
            {showStrategicPlanning && (
              <div className="pt-2">
                <StrategicPlanningSection
                  data={strategicPlanning}
                  onChange={setStrategicPlanning}
                />
              </div>
            )}
          </div>
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
            {intent && (
              <span className="text-sm text-muted-foreground">
                Step {step} of {totalSteps}
              </span>
            )}
            <DevModeActivator>
              <ThemeToggle />
            </DevModeActivator>
          </div>
        </div>
      </header>

      {/* Progress */}
      {intent && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8">
        <Card className="glass-card border-0 shadow-elevated overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <AnimatePresence mode="wait">
              {step === 0 && renderIntentSelection()}
              {step > 0 && intent === 'same_field' && renderSameFieldFlow()}
              {step > 0 && intent === 'new_field' && renderNewFieldFlow()}
            </AnimatePresence>

            {/* Navigation */}
            <AnimatePresence>
              {step > 0 && (
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
                        Generate Plan
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlanReset;
