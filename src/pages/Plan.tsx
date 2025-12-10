import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Sparkles, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Plan = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Kaamyab</span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, {profile.fullName.split(' ')[0]}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Plan</h1>
          <p className="text-muted-foreground">AI-powered productivity planning</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="shadow-card border-border/50 animate-slide-up">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent mb-6">
              <Sparkles className="w-10 h-10 text-primary animate-pulse-soft" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              AI Planning Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Your personalized AI-generated productivity plan will appear here. 
              We're working hard to bring intelligent planning to Kaamyab.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-secondary-foreground text-sm">
              <Clock className="w-4 h-4" />
              Phase 2 in Development
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {profile && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Card className="shadow-card border-border/50">
              <CardContent className="py-4 text-center">
                <p className="text-muted-foreground text-sm">Project</p>
                <p className="font-semibold text-foreground truncate">{profile.projectTitle}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border/50">
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
            <Card className="shadow-card border-border/50">
              <CardContent className="py-4 text-center">
                <p className="text-muted-foreground text-sm">Days Left</p>
                <p className="font-semibold text-primary">
                  {Math.max(0, Math.ceil((new Date(profile.projectDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Plan;
