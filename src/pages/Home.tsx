import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Rocket, Calendar, Target, ArrowRight, Plus, LogOut } from 'lucide-react';

interface PlanSummary {
  overview: string;
  total_weeks: number;
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
            // No plan found
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

  // Redirect to plan/new if no plan exists
  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/new', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {profile?.fullName?.split(' ')[0] || 'Champion'}!
              </h1>
              <p className="text-muted-foreground">Ready to crush your goals?</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Plan Summary Card */}
        {planSummary && (
          <Card className="mb-6 border-primary/20 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {planSummary.project_title || 'Your Project Plan'}
              </CardTitle>
              <CardDescription>{planSummary.overview}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{planSummary.total_weeks} weeks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-auto py-6 flex flex-col items-center gap-2 gradient-kaamyab hover:opacity-90"
            onClick={() => navigate('/plan')}
          >
            <ArrowRight className="w-6 h-6" />
            <span className="text-lg font-semibold">View My Plan</span>
            <span className="text-sm opacity-80">See your full weekly breakdown</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2 border-primary/30 hover:bg-primary/5"
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
