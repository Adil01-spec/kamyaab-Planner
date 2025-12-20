import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TaskItem } from '@/components/TaskItem';
import { 
  Rocket, LogOut, Target, Calendar, 
  Sparkles, ChevronRight, Plus, Loader2, Quote, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface Milestone {
  title: string;
  week: number;
}

interface PlanData {
  overview: string;
  total_weeks: number;
  milestones: Milestone[];
  weeks: Week[];
  motivation: string[];
}

const Plan = () => {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('plan_json')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.plan_json) {
          setPlan(data.plan_json as unknown as PlanData);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Toggle task completion and persist to database
  const toggleTask = useCallback(async (weekIndex: number, taskIndex: number) => {
    if (!plan || !user) return;

    const updatedPlan = { ...plan };
    const task = updatedPlan.weeks[weekIndex].tasks[taskIndex];
    task.completed = !task.completed;
    
    setPlan({ ...updatedPlan });
    setSaving(true);

    try {
      const { error } = await supabase
        .from('plans')
        .update({ plan_json: updatedPlan as unknown as Json })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving task completion:', error);
      // Revert on error
      task.completed = !task.completed;
      setPlan({ ...updatedPlan });
    } finally {
      setSaving(false);
    }
  }, [plan, user]);

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    if (!plan) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    let total = 0;
    
    plan.weeks.forEach(week => {
      week.tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });
    
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [plan]);

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Kaamyab</span>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            <ThemeToggle />
            {profile && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {profile.fullName.split(' ')[0]}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="btn-press">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!plan ? (
          /* No Plan State */
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/30 mb-6">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                No Plan Yet
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate your personalized AI productivity plan to start achieving your goals.
              </p>
              <Button 
                onClick={() => navigate('/plan/new')} 
                className="gradient-kaamyab hover:opacity-90 btn-press"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Plan Display */
          <div className="space-y-6">
            {/* Overview */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">Your AI Plan</h1>
              <p className="text-muted-foreground">{plan.overview}</p>
            </div>

            {/* Progress Overview Card */}
            <Card className="glass-card glass-card-hover animate-slide-up">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Overall Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        {progress.completed} of {progress.total} tasks completed
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} className="h-3" />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {profile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Project</p>
                    <p className="font-semibold text-foreground truncate">{profile.projectTitle}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Total Weeks</p>
                    <p className="font-semibold text-primary text-2xl">{plan.total_weeks}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card glass-card-hover">
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">Deadline</p>
                    <p className="font-semibold text-foreground">
                      {new Date(profile.projectDeadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Milestones */}
            {plan.milestones && plan.milestones.length > 0 && (
              <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle>Key Milestones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {plan.milestones.map((milestone, index) => (
                        <div key={index} className="relative flex items-center gap-4 pl-8">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          <div className="flex-1 flex items-center justify-between p-3 glass-subtle rounded-lg">
                            <span className="font-medium">{milestone.title}</span>
                            <Badge variant="outline" className="text-xs">
                              Week {milestone.week}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Plans */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Breakdown
              </h2>
              {plan.weeks.map((week, weekIndex) => {
                const weekCompleted = week.tasks.filter(t => t.completed).length;
                const weekTotal = week.tasks.length;
                const weekPercent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
                
                return (
                  <Card 
                    key={week.week} 
                    className="glass-card glass-card-hover animate-slide-up"
                    style={{ animationDelay: `${0.1 * (weekIndex + 2)}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-kaamyab flex items-center justify-center text-primary-foreground font-bold">
                            {week.week}
                          </div>
                          <div>
                            <CardTitle className="text-lg">Week {week.week}</CardTitle>
                            <p className="text-sm text-muted-foreground">{week.focus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {weekCompleted}/{weekTotal}
                          </span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${weekPercent}%` }}
                            />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {week.tasks.map((task, taskIndex) => (
                          <TaskItem
                            key={taskIndex}
                            title={task.title}
                            priority={task.priority}
                            estimatedHours={task.estimated_hours}
                            completed={task.completed || false}
                            onToggle={() => toggleTask(weekIndex, taskIndex)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Motivation */}
            {plan.motivation && plan.motivation.length > 0 && (
              <Card className="glass-card gradient-kaamyab text-primary-foreground animate-slide-up">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Quote className="w-5 h-5" />
                    <CardTitle className="text-primary-foreground">Stay Motivated</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.motivation.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-1 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Regenerate Button */}
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/plan/new')}
                className="btn-press glass border-primary/30 hover:bg-primary/5"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Plan
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Plan;