import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Rocket, Calendar, Target, ArrowRight, Plus, LogOut, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

interface PlanSummary {
  overview: string;
  total_weeks: number;
  current_week?: number;
  project_title?: string;
}

const Home = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoPlan, setHasNoPlan] = useState(false);

  useEffect(() => {
    const fetchLatestPlan = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('plans')
          .select('plan_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setHasNoPlan(true);
          }
          setLoading(false);
          return;
        }

        if (data?.plan_json) {
          const planData = data.plan_json as Record<string, unknown>;
          setPlanSummary({
            overview: planData.overview as string || '',
            total_weeks: planData.total_weeks as number || 0,
            current_week: 1, // Default to week 1 for now
            project_title: profile?.projectTitle || ''
          });
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPlan();
  }, [user, profile?.projectTitle]);

  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/new', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const progressPercent = planSummary 
    ? Math.round(((planSummary.current_week || 1) / planSummary.total_weeks) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 animate-pulse-soft">
          <Rocket className="w-8 h-8 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="flex items-center justify-end mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl gradient-kaamyab flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Rocket className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Welcome back, {profile?.fullName?.split(' ')[0] || 'Champion'}!
                </h1>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground text-base sm:text-lg">
                Let's move your project forward today.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Progress Card */}
        {planSummary && (
          <Card className="mb-4 border-primary/20 bg-card/80 backdrop-blur hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {planSummary.project_title || 'Your Project Plan'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Week {planSummary.current_week || 1} of {planSummary.total_weeks}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4 line-clamp-2">{planSummary.overview}</CardDescription>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Today's Focus Card */}
        <Card className="mb-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <CardTitle className="text-base">Today's Focus</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Keep building momentum!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Review your plan and tackle the next milestone. Every step counts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-auto py-5 flex flex-col items-center gap-2 gradient-kaamyab hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            onClick={() => navigate('/plan')}
          >
            <ArrowRight className="w-6 h-6" />
            <span className="text-lg font-semibold">Continue Plan</span>
            <span className="text-sm opacity-80">Pick up where you left off</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-5 flex flex-col items-center gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300"
            onClick={() => navigate('/plan/new')}
          >
            <Plus className="w-6 h-6" />
            <span className="text-lg font-semibold">Generate New Plan</span>
            <span className="text-sm text-muted-foreground">Create a fresh AI-powered plan</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
