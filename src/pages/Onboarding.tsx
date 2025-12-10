import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Rocket, User, Briefcase, Code, Palette, GraduationCap, Store, Video, Calendar, FileText } from 'lucide-react';

type Profession = 'software_engineer' | 'freelancer' | 'student' | 'business_owner' | 'content_creator';

interface OnboardingData {
  fullName: string;
  profession: Profession | '';
  professionDetails: Record<string, any>;
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
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
  });
  const [loading, setLoading] = useState(false);
  const { saveProfile } = useAuth();
  const navigate = useNavigate();

  const profession = data.profession ? professionConfig[data.profession] : null;
  
  // Calculate total steps: 2 base + profession questions + 3 project questions
  const professionQuestions = profession?.questions.filter(q => {
    if (!q.showIf) return true;
    return Object.entries(q.showIf).every(([key, value]) => data.professionDetails[key] === value);
  }) || [];
  
  const totalSteps = 2 + professionQuestions.length + 3;
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

  const canProceed = () => {
    if (step === 1) return data.fullName.trim().length > 0;
    if (step === 2) return data.profession !== '';
    
    const professionStep = step - 3;
    if (professionStep >= 0 && professionStep < professionQuestions.length) {
      const question = professionQuestions[professionStep];
      if (question.type === 'text' && question.label.includes('Optional')) return true;
      if (question.type === 'chips') {
        return (data.professionDetails[question.key] || []).length > 0;
      }
      return data.professionDetails[question.key];
    }
    
    const projectStep = step - 2 - professionQuestions.length;
    if (projectStep === 1) return data.projectTitle.trim().length > 0;
    if (projectStep === 2) return data.projectDescription.trim().length > 0;
    if (projectStep === 3) return data.projectDeadline !== '';
    
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveProfile({
        fullName: data.fullName,
        profession: data.profession,
        professionDetails: data.professionDetails,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        projectDeadline: data.projectDeadline,
      });
      toast.success('Profile saved successfully!');
      navigate('/plan/new');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
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
            <Input
              placeholder={`Enter ${question.label.toLowerCase()}`}
              value={data.professionDetails[question.key] || ''}
              onChange={(e) => updateProfessionDetail(question.key, e.target.value)}
              className="h-12"
              autoFocus
            />
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

          {question.type === 'chips' && (
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
          )}
        </div>
      );
    }

    // Project questions
    const projectStep = step - 2 - professionQuestions.length;

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
            onChange={(e) => setData(prev => ({ ...prev, projectDeadline: e.target.value }))}
            className="h-12"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      );
    }

    return null;
  };

  const isLastStep = step === totalSteps;

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
              <Button
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 h-12 gradient-kaamyab hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
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
