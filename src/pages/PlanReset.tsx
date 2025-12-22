import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Rocket, Sparkles, CalendarIcon, Briefcase, Code, Bot, 
  Loader2, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PlanReset = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Form state - initialized from profile
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDeadline, setProjectDeadline] = useState<Date | undefined>();
  const [noDeadline, setNoDeadline] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setProjectTitle(profile.projectTitle || '');
      setProjectDescription(profile.projectDescription || '');
      
      const profDetails = profile.professionDetails as { noDeadline?: boolean } | null;
      if (profDetails?.noDeadline) {
        setNoDeadline(true);
      } else if (profile.projectDeadline) {
        setProjectDeadline(new Date(profile.projectDeadline));
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
        
        // If plan exists, redirect to /plan
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

  const handleGenerate = async () => {
    if (!user || !profile) return;

    // Validation
    if (!projectTitle.trim()) {
      toast({
        title: "Project title required",
        description: "Please enter a project title.",
        variant: "destructive",
      });
      return;
    }

    if (!noDeadline && !projectDeadline) {
      toast({
        title: "Deadline required",
        description: "Please select a deadline or check 'There is no deadline'.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Update profile with new project details if changed
      const professionDetails = {
        ...(profile.professionDetails as object || {}),
        noDeadline,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          project_title: projectTitle,
          project_description: projectDescription,
          project_deadline: noDeadline ? null : projectDeadline?.toISOString().split('T')[0],
          profession_details: professionDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Refresh profile in context
      await refreshProfile();

      // Generate new plan
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.plan) {
        // Insert new plan
        const { error: insertError } = await supabase
          .from('plans')
          .insert({
            user_id: user.id,
            plan_json: data.plan,
          });

        if (insertError) throw insertError;

        toast({
          title: "Plan generated!",
          description: "Your new productivity plan is ready.",
        });

        navigate('/plan');
      } else {
        throw new Error('Failed to generate plan');
      }
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

  // Loading state while checking for existing plan
  if (checkingPlan) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get profession details for display
  const profDetails = profile?.professionDetails as {
    employmentType?: string;
    techStack?: string[];
    technologies?: string[];
    aiToolsUsed?: boolean;
    aiToolsList?: string;
  } | null;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Kaamyab</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-kaamyab mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Let's reshape your plan
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your profile is ready. Adjust your project details below and generate a fresh plan.
          </p>
        </div>

        {/* Context Card - Read Only Profile Info */}
        <Card className="glass-card animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-subtle p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Profession</p>
                <p className="text-sm font-medium text-foreground">{profile?.profession}</p>
              </div>
              {profDetails?.employmentType && (
                <div className="glass-subtle p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Employment</p>
                  <p className="text-sm font-medium text-foreground">{profDetails.employmentType}</p>
                </div>
              )}
            </div>
            
            {profDetails?.techStack && profDetails.techStack.length > 0 && (
              <div className="glass-subtle p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Code className="w-3 h-3" /> Tech Stack
                </p>
                <div className="flex flex-wrap gap-1">
                  {profDetails.techStack.map((tech, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profDetails?.aiToolsUsed && profDetails.aiToolsList && (
              <div className="glass-subtle p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> AI Tools
                </p>
                <p className="text-sm text-foreground">{profDetails.aiToolsList}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjustable Project Details */}
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Project Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Modify these to reshape your plan
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Project Title
              </label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter project title"
                className="glass-subtle border-border/50 focus:border-primary/50"
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Project Description
              </label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project goals..."
                rows={4}
                className="glass-subtle border-border/50 focus:border-primary/50 resize-none"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Project Deadline
              </label>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={noDeadline}
                    className={cn(
                      "w-full justify-start text-left glass-subtle border-border/50",
                      !projectDeadline && !noDeadline && "text-muted-foreground",
                      noDeadline && "opacity-50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {projectDeadline && !noDeadline
                      ? format(projectDeadline, "PPP")
                      : "Select a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass" align="start">
                  <Calendar
                    mode="single"
                    selected={projectDeadline}
                    onSelect={setProjectDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* No Deadline Checkbox */}
              <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg">
                <Checkbox
                  id="no-deadline"
                  checked={noDeadline}
                  onCheckedChange={(checked) => {
                    setNoDeadline(checked === true);
                    if (checked) {
                      setProjectDeadline(undefined);
                    }
                  }}
                  className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label 
                  htmlFor="no-deadline" 
                  className="text-sm text-muted-foreground cursor-pointer flex-1"
                >
                  There is no deadline — focus on consistency and momentum
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-6 text-lg gradient-kaamyab hover:opacity-90 btn-press"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating your plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate New Plan
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default PlanReset;
