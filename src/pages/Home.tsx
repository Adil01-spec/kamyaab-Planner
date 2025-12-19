import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Leaf,
  Quote,
  Clock,
  Cpu,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const [progressValue, setProgressValue] = useState(0);
  const rippleRef = useRef<HTMLDivElement>(null);

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
            current_week: 1,
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

  // Animate progress bar on load
  useEffect(() => {
    if (planSummary) {
      const targetPercent = Math.round(((planSummary.current_week || 1) / planSummary.total_weeks) * 100);
      const timer = setTimeout(() => setProgressValue(targetPercent), 100);
      return () => clearTimeout(timer);
    }
  }, [planSummary]);

  useEffect(() => {
    if (!loading && hasNoPlan) {
      navigate('/plan/new', { replace: true });
    }
  }, [loading, hasNoPlan, navigate]);

  // Cursor ripple effect handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rippleRef.current) {
      const rect = rippleRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      rippleRef.current.style.setProperty('--ripple-x', `${x}px`);
      rippleRef.current.style.setProperty('--ripple-y', `${y}px`);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const progressPercent = planSummary 
    ? Math.round(((planSummary.current_week || 1) / planSummary.total_weeks) * 100) 
    : 0;

  const userInitials = profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 animate-float shadow-glow">
          <Leaf className="w-8 h-8 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div 
      ref={rippleRef}
      className="min-h-screen gradient-subtle overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        '--ripple-x': '50%',
        '--ripple-y': '50%',
      } as React.CSSProperties}
    >
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* A. Minimal Top Bar */}
        <header className="flex items-center justify-between mb-10 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-kaamyab flex items-center justify-center shadow-soft">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full btn-press">
                <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{profile?.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/onboarding')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* B. Hero Greeting Section */}
        <section className="relative mb-10 hero-glow rounded-3xl p-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative z-10">
            <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Today's focus
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Welcome back, {profile?.fullName?.split(' ')[0] || 'Champion'}
            </h1>
            <p className="text-muted-foreground text-lg">
              One clear plan. One meaningful step forward.
            </p>
          </div>
        </section>

        {/* C. Active Plan Hero Card */}
        {planSummary && (
          <Card 
            className="mb-6 border-0 shadow-card bg-card rounded-2xl interactive-card ripple-container overflow-hidden animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                      Active Plan
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-1">
                    {planSummary.project_title || 'Your Project Plan'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-base">
                    {planSummary.overview}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Meta row */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {planSummary.total_weeks} weeks
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  AI Generated
                </span>
              </div>

              {/* Progress section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Week {planSummary.current_week || 1} of {planSummary.total_weeks} completed
                  </span>
                  <span className="font-semibold text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressValue} className="h-2.5 transition-all duration-1000" />
              </div>

              {/* Primary CTA */}
              <Button
                size="lg"
                className="w-full mt-6 h-12 gradient-kaamyab text-base font-semibold shadow-soft btn-press hover:shadow-elevated transition-all duration-300"
                onClick={() => navigate('/plan')}
              >
                Continue My Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* D. Secondary Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Generate New Plan Card */}
          <Card 
            className="border border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl cursor-pointer interactive-card ripple-container group"
            onClick={() => navigate('/plan/new')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Generate New Plan</h3>
              <p className="text-sm text-muted-foreground">
                Create a fresh AI-powered plan
              </p>
            </CardContent>
          </Card>

          {/* Motivational Insight Card */}
          <Card className="border border-accent/40 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center flex-shrink-0">
                  <Quote className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium leading-relaxed">
                    "Consistency beats intensity. Small steps compound."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Daily Wisdom</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
