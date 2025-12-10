import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Rocket, User, Briefcase, FileText, Calendar, Sparkles, ArrowRight } from 'lucide-react';

const professionLabels: Record<string, string> = {
  software_engineer: 'Software Engineer',
  freelancer: 'Freelancer',
  student: 'Student',
  business_owner: 'Business Owner',
  content_creator: 'Content Creator',
};

const PlanNew = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleGeneratePlan = () => {
    toast.info('AI plan generation coming soon! 🚀', {
      description: 'We\'re working on bringing AI-powered planning to Kaamyab.',
    });
    setTimeout(() => {
      navigate('/plan');
    }, 1500);
  };

  if (!profile) {
    return null;
  }

  const formatDetails = (details: Record<string, any>) => {
    return Object.entries(details)
      .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
      .map(([key, value]) => ({
        key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: Array.isArray(value) ? value.join(', ') : value,
      }));
  };

  return (
    <div className="min-h-screen p-4 gradient-subtle">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="w-10 h-10 rounded-xl gradient-kaamyab flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ready to Plan</h1>
            <p className="text-muted-foreground text-sm">Review your profile and generate your AI plan</p>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="space-y-4 mb-8">
          {/* Personal Info */}
          <Card className="shadow-card border-border/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Personal Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profession</span>
                  <span className="font-medium">{professionLabels[profile.profession] || profile.profession}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profession Details */}
          {Object.keys(profile.professionDetails).length > 0 && (
            <Card className="shadow-card border-border/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Professional Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formatDetails(profile.professionDetails).map(({ key, value }) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Info */}
          <Card className="shadow-card border-border/50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-muted-foreground text-sm">Title</span>
                  <p className="font-semibold text-lg mt-1">{profile.projectTitle}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Description</span>
                  <p className="mt-1 text-foreground/90">{profile.projectDescription}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground text-sm">Deadline:</span>
                  <span className="font-medium">
                    {new Date(profile.projectDeadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Button
            onClick={handleGeneratePlan}
            className="w-full h-14 text-lg font-semibold gradient-kaamyab hover:opacity-90 transition-all shadow-elevated"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Plan
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-center text-muted-foreground text-sm mt-3">
            Our AI will create a personalized productivity plan based on your profile
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanNew;
