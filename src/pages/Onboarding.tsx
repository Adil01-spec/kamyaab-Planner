import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  ArrowLeft, ArrowRight, Loader2, Rocket, User, Briefcase, Code, Palette, 
  GraduationCap, Store, Video, Calendar, FileText, Bot, Crown, Target,
  Zap, Users, Clock, AlertTriangle, CheckCircle, SkipForward, Link
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { EXECUTIVE_ROLES } from '@/lib/executiveDetection';
import { parseLinkedInUrl, isValidLinkedInUrl } from '@/lib/linkedinParser';
import { 
  PlanningMode, PlanContext, SeniorityLevel, PlanningScope, TimeHorizon,
  SENIORITY_LEVELS, PLANNING_SCOPES, TIME_HORIZONS, RISK_TOLERANCES,
  RiskTolerance, createStrategicPlanContext
} from '@/lib/strategicPlanningTypes';

type Profession = 'software_engineer' | 'freelancer' | 'student' | 'business_owner' | 'content_creator' | 'executive';

interface OnboardingData {
  fullName: string;
  profession: Profession | '';
  professionDetails: Record<string, any>;
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
  noDeadline: boolean;
  // Phase 8.1: Strategic Planning Mode
  planningMode: PlanningMode;
  planContext: PlanContext | null;
}

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
      { key: 'aiToolsUsed', label: 'Do you use any AI tools or agentic assistance?', type: 'boolean' },
      { key: 'aiToolsList', label: 'AI Tools You Use', type: 'text', showIf: { aiToolsUsed: 'yes' } },
    ],
  },
  freelancer: {
    label: 'Freelancer',
    icon: Palette,
    questions: [
      { key: 'freelancerType', label: 'Freelancer Type', type: 'select', options: ['Web Development', 'Mobile Development', 'Graphics Design', 'UI/UX Design'] },
      { key: 'tools', label: 'Tools & Technologies', type: 'chips', options: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'React', 'WordPress', 'Shopify'] },
      { key: 'portfolioLink', label: 'Portfolio Link (Optional)', type: 'text' },
    ],
  },
  student: {
    label: 'Student',
    icon: GraduationCap,
    questions: [
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'select', options: ['Computer Science', 'Information Technology', 'Business', 'Engineering', 'Other'] },
      { key: 'semester', label: 'Semester/Year', type: 'text' },
      { key: 'capstoneProject', label: 'Capstone/Major Project Idea', type: 'textarea' },
    ],
  },
  business_owner: {
    label: 'Business Owner',
    icon: Store,
    questions: [
      { key: 'platform', label: 'Primary Platform', type: 'select', options: ['Shopify', 'Social Media', 'Own Website', 'Marketplace'] },
      { key: 'productCategory', label: 'Product Category', type: 'select', options: ['Clothing', 'Jewelry', 'Digital Products', 'Food & Beverages', 'Other'] },
      { key: 'revenueGoal', label: 'Monthly Revenue Goal (PKR)', type: 'text' },
    ],
  },
  content_creator: {
    label: 'Content Creator',
    icon: Video,
    questions: [
      { key: 'platform', label: 'Primary Platform', type: 'select', options: ['YouTube', 'TikTok', 'Instagram', 'LinkedIn', 'Multiple'] },
      { key: 'niche', label: 'Content Niche', type: 'select', options: ['Tech', 'Vlog', 'Education', 'Entertainment', 'Business', 'Other'] },
      { key: 'postingFrequency', label: 'Posts per Week', type: 'select', options: ['1-2', '3-4', '5-7', 'Daily'] },
    ],
  },
  executive: {
    label: 'Executive / Leadership',
    icon: Crown,
    questions: [
      { key: 'executiveRole', label: 'Your Role', type: 'select', options: EXECUTIVE_ROLES },
      { key: 'executiveRoleCustom', label: 'Specify Your Role', type: 'text', showIf: { executiveRole: 'Other Executive Role' } },
      { key: 'companySize', label: 'Company Size', type: 'select', options: ['Solo / 1-5', '6-20', '21-50', '51-200', '200+'] },
      { key: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Manufacturing', 'Services', 'Other'] },
      { key: 'linkedinImport', label: 'LinkedIn Profile URL (Optional)', type: 'linkedin' },
    ],
  },
};

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
    planningMode: 'standard',
    planContext: null,
  });
  const [loading, setLoading] = useState(false);
  const [linkedinValidation, setLinkedinValidation] = useState<{ valid: boolean; detectedRole?: string }>({ valid: true });
  const { saveProfile } = useAuth();
  const navigate = useNavigate();

  // Strategic planning mode determines additional steps
  const isStrategicMode = data.planningMode === 'strategic';

  const profession = data.profession ? professionConfig[data.profession] : null;
  
  // Calculate total steps based on planning mode
  const professionQuestions = profession?.questions.filter(q => {
    if (!q.showIf) return true;
    return Object.entries(q.showIf).every(([key, value]) => data.professionDetails[key] === value);
  }) || [];
  
  // Base steps: 1 (name) + 1 (profession) + professionQuestions + 1 (planning mode choice) + 3 (project) 
  // Strategic adds: 5 steps (seniority, scope, time horizon, constraints, success)
  const strategicSteps = isStrategicMode ? 5 : 0;
  const totalSteps = 2 + professionQuestions.length + 1 + strategicSteps + 3;
  const progress = (step / totalSteps) * 100;

  // LinkedIn URL parsing effect
  useEffect(() => {
    const linkedinUrl = data.professionDetails.linkedinImport;
    if (linkedinUrl && typeof linkedinUrl === 'string') {
      const isValid = isValidLinkedInUrl(linkedinUrl);
      const parseResult = parseLinkedInUrl(linkedinUrl);
      
      setLinkedinValidation({
        valid: isValid,
        detectedRole: parseResult.detectedRole,
      });

      // Auto-fill executive role if detected with medium+ confidence
      if (parseResult.detectedRole && parseResult.confidence !== 'none' && parseResult.confidence !== 'low') {
        if (!data.professionDetails.executiveRole || data.professionDetails.executiveRole === '') {
          updateProfessionDetail('executiveRole', parseResult.detectedRole);
        }
      }
    } else {
      setLinkedinValidation({ valid: true });
    }
  }, [data.professionDetails.linkedinImport]);

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

  const getCombinedChips = (key: string): string[] => {
    const predefined = data.professionDetails[key] || [];
    const customRaw = data.professionDetails[`${key}_custom`] || '';
    
    if (!customRaw.trim()) return predefined;
    
    const customItems = customRaw
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
    
    const combined = [...predefined];
    const lowerCasePredefined = predefined.map((p: string) => p.toLowerCase());
    
    customItems.forEach((item: string) => {
      if (!lowerCasePredefined.includes(item.toLowerCase())) {
        combined.push(item);
      }
    });
    
    return combined;
  };

  const updatePlanContext = <K extends keyof PlanContext>(field: K, value: PlanContext[K]) => {
    setData(prev => ({
      ...prev,
      planContext: {
        ...(prev.planContext || createStrategicPlanContext()),
        [field]: value,
      },
    }));
  };

  const togglePlanningScope = (scope: PlanningScope) => {
    const current = data.planContext?.planning_scope || [];
    const updated = current.includes(scope)
      ? current.filter(s => s !== scope)
      : [...current, scope];
    updatePlanContext('planning_scope', updated);
  };

  const canProceed = () => {
    if (step === 1) return data.fullName.trim().length > 0;
    if (step === 2) return data.profession !== '';
    
    const professionStep = step - 3;
    if (professionStep >= 0 && professionStep < professionQuestions.length) {
      const question = professionQuestions[professionStep];
      if (question.type === 'text' && (question.label.includes('Optional') || question.key === 'aiToolsList')) return true;
      if (question.type === 'linkedin') return true; // LinkedIn is always optional
      if (question.type === 'boolean') return data.professionDetails[question.key] !== undefined;
      if (question.type === 'chips') {
        const predefined = data.professionDetails[question.key] || [];
        const customRaw = data.professionDetails[`${question.key}_custom`] || '';
        const customItems = customRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        return predefined.length > 0 || customItems.length > 0;
      }
      return data.professionDetails[question.key];
    }
    
    // Planning mode selection step (always can proceed with default)
    const planningModeStep = 2 + professionQuestions.length + 1;
    if (step === planningModeStep) return true;

    // Strategic planning steps (all optional)
    if (isStrategicMode) {
      const strategicStepIndex = step - planningModeStep;
      if (strategicStepIndex >= 1 && strategicStepIndex <= 5) {
        return true; // All strategic steps are skippable
      }
    }
    
    // Project steps
    const projectStepStart = planningModeStep + strategicSteps;
    const projectStep = step - projectStepStart;
    if (projectStep === 1) return data.projectTitle.trim().length > 0;
    if (projectStep === 2) return data.projectDescription.trim().length > 0;
    if (projectStep === 3) return data.noDeadline || data.projectDeadline !== '';
    
    return true;
  };

  const handleNext = () => {
    if (canProceed()) {
      // When selecting planning mode, initialize context if strategic
      const planningModeStep = 2 + professionQuestions.length + 1;
      if (step === planningModeStep && data.planningMode === 'strategic' && !data.planContext) {
        setData(prev => ({ ...prev, planContext: createStrategicPlanContext() }));
      }
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const processedDetails: Record<string, any> = { 
        ...data.professionDetails, 
        noDeadline: data.noDeadline,
      };
      
      if (processedDetails.technologies !== undefined || processedDetails.technologies_custom) {
        processedDetails.technologies = getCombinedChips('technologies');
        delete processedDetails.technologies_custom;
      }
      
      if (processedDetails.tools !== undefined || processedDetails.tools_custom) {
        processedDetails.tools = getCombinedChips('tools');
        delete processedDetails.tools_custom;
      }
      
      await saveProfile({
        fullName: data.fullName,
        profession: data.profession,
        professionDetails: processedDetails,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        projectDeadline: data.noDeadline ? null : data.projectDeadline,
      });
      
      toast.success('Profile saved! Generating your plan...');
      
      // Generate the plan with plan context metadata
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
            // Include plan context metadata (does NOT change AI behavior per Phase 8.1)
            planContext: data.planContext,
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
    // Step 1: Full Name
    if (step === 1) {
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
    if (step === 2) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">What do you do?</h2>
            <p className="text-muted-foreground text-sm mt-1">We'll customize your planning experience</p>
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

    // Profession-specific questions
    const professionStep = step - 3;
    if (professionStep >= 0 && professionStep < professionQuestions.length) {
      const question = professionQuestions[professionStep];
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
                placeholder={question.key === 'aiToolsList' 
                  ? "e.g., ChatGPT, Cursor, Copilot, custom agents"
                  : `Enter ${question.label.toLowerCase()}`}
                value={data.professionDetails[question.key] || ''}
                onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
                className="h-12"
                autoFocus
              />
              {question.key === 'aiToolsList' && (
                <p className="text-xs text-muted-foreground">
                  You can list multiple tools separated by commas
                </p>
              )}
            </div>
          )}

          {question.type === 'linkedin' && (
            <div className="space-y-3">
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="https://linkedin.com/in/your-profile"
                  value={data.professionDetails[question.key] || ''}
                  onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
                  className="h-12 pl-10"
                  autoFocus
                />
              </div>
              {linkedinValidation.detectedRole && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">
                    Detected role: <strong>{linkedinValidation.detectedRole}</strong>
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Optional: We'll try to detect your role from your LinkedIn profile
              </p>
            </div>
          )}

          {question.type === 'textarea' && (
            <Textarea
              placeholder={`Enter ${question.label.toLowerCase()}`}
              value={data.professionDetails[question.key] || ''}
              onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
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

    // Planning Mode Selection Step
    const planningModeStep = 2 + professionQuestions.length + 1;
    if (step === planningModeStep) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Do you want to plan at a strategic level?</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Enable this if you're planning long-term initiatives, business strategy, or complex projects. You can skip this.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setData(prev => ({ ...prev, planningMode: 'standard', planContext: null }))}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                data.planningMode === 'standard'
                  ? 'border-primary bg-accent shadow-soft'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <div className={`p-3 rounded-lg ${data.planningMode === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium block">Standard planning</span>
                <span className="text-sm text-muted-foreground">Quick, task-focused planning for everyday projects</span>
              </div>
            </button>
            <button
              onClick={() => setData(prev => ({ ...prev, planningMode: 'strategic', planContext: createStrategicPlanContext() }))}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                data.planningMode === 'strategic'
                  ? 'border-primary bg-accent shadow-soft'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <div className={`p-3 rounded-lg ${data.planningMode === 'strategic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium block">Strategic planning</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground ml-1">Advanced</span>
                <span className="text-sm text-muted-foreground block mt-0.5">Long-term initiatives, business strategy, complex projects</span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Strategic Planning Steps (only if strategic mode is enabled)
    if (isStrategicMode) {
      const strategicStepIndex = step - planningModeStep;

      // Step 1: Seniority Level
      if (strategicStepIndex === 1) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">What best describes your role?</h2>
              <p className="text-muted-foreground text-sm mt-1">This helps us understand your planning context</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SENIORITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updatePlanContext('planning_seniority', level.value)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    data.planContext?.planning_seniority === level.value
                      ? 'border-primary bg-accent shadow-soft'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <span className="font-medium">{level.label}</span>
                  {data.planContext?.planning_seniority === level.value && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      }

      // Step 2: Planning Scope
      if (strategicStepIndex === 2) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">What is the scope of this plan?</h2>
              <p className="text-muted-foreground text-sm mt-1">Select all that apply</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PLANNING_SCOPES.map((scope) => {
                const isSelected = data.planContext?.planning_scope?.includes(scope.value) || false;
                return (
                  <button
                    key={scope.value}
                    onClick={() => togglePlanningScope(scope.value)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-accent shadow-soft'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                  >
                    <span className="font-medium">{scope.label}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // Step 3: Time Horizon
      if (strategicStepIndex === 3) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">What time horizon are you planning for?</h2>
              <p className="text-muted-foreground text-sm mt-1">How far ahead are you thinking?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TIME_HORIZONS.map((horizon) => (
                <button
                  key={horizon.value}
                  onClick={() => updatePlanContext('time_horizon', horizon.value)}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    data.planContext?.time_horizon === horizon.value
                      ? 'border-primary bg-accent shadow-soft'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <span className="font-medium">{horizon.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }

      // Step 4: Constraints
      if (strategicStepIndex === 4) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Any constraints we should consider?</h2>
              <p className="text-muted-foreground text-sm mt-1">All fields are optional</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget" className="text-sm">Budget limit</Label>
                <Input
                  id="budget"
                  placeholder="e.g., $50,000 or unlimited"
                  value={data.planContext?.constraints?.budget || ''}
                  onChange={(e) => updatePlanContext('constraints', { ...data.planContext?.constraints, budget: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="teamSize" className="text-sm">Team size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  placeholder="e.g., 5"
                  value={data.planContext?.constraints?.team_size || ''}
                  onChange={(e) => updatePlanContext('constraints', { ...data.planContext?.constraints, team_size: parseInt(e.target.value) || undefined })}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="dependencies" className="text-sm">Key dependencies</Label>
                <Input
                  id="dependencies"
                  placeholder="e.g., Waiting on vendor approval"
                  value={data.planContext?.constraints?.dependencies || ''}
                  onChange={(e) => updatePlanContext('constraints', { ...data.planContext?.constraints, dependencies: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Risk tolerance</Label>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_TOLERANCES.map((risk) => (
                    <button
                      key={risk.value}
                      onClick={() => updatePlanContext('constraints', { ...data.planContext?.constraints, risk_tolerance: risk.value })}
                      className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        data.planContext?.constraints?.risk_tolerance === risk.value
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {risk.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Step 5: Success Definition
      if (strategicStepIndex === 5) {
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">How will you know this plan succeeded?</h2>
              <p className="text-muted-foreground text-sm mt-1">Optional: Define what success looks like</p>
            </div>
            <Textarea
              placeholder="e.g., Launch product to 1,000 users, achieve $100K ARR, build a team of 5..."
              value={data.planContext?.success_definition || ''}
              onChange={(e) => updatePlanContext('success_definition', e.target.value)}
              className="min-h-[150px]"
              autoFocus
            />
          </div>
        );
      }
    }

    // Project steps
    const projectStepStart = planningModeStep + strategicSteps;
    const projectStep = step - projectStepStart;

    if (projectStep === 1) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Project Title</h2>
            <p className="text-muted-foreground text-sm mt-1">What are you working on?</p>
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

    if (projectStep === 2) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Project Description</h2>
            <p className="text-muted-foreground text-sm mt-1">Tell us more about your project</p>
          </div>
          <Textarea
            placeholder="Describe your project goals, milestones, and what success looks like..."
            value={data.projectDescription}
            onChange={(e) => setData(prev => ({ ...prev, projectDescription: e.target.value }))}
            className="min-h-[150px]"
            autoFocus
          />
        </div>
      );
    }

    if (projectStep === 3) {
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Project Deadline</h2>
            <p className="text-muted-foreground text-sm mt-1">When do you want to complete this?</p>
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
              There is no deadline
            </label>
          </div>
          {data.noDeadline && (
            <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              No worries! We'll create a flexible plan focused on consistency and steady progress.
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  const isLastStep = step === totalSteps;
  
  // Determine if current step is a skippable strategic step
  const planningModeStep = 2 + professionQuestions.length + 1;
  const isStrategicStep = isStrategicMode && step > planningModeStep && step <= planningModeStep + 5;
  
  // Check if current step is the linkedin field
  const professionStep = step - 3;
  const isLinkedinStep = professionStep >= 0 && professionStep < professionQuestions.length && 
    professionQuestions[professionStep]?.type === 'linkedin';

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
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
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
              
              {/* Skip button for strategic steps and linkedin */}
              {(isStrategicStep || isLinkedinStep) && !isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="h-12 px-4"
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
      </div>
    </div>
  );
};

export default Onboarding;
