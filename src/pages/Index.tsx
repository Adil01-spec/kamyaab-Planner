import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Rocket } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true });
      } else if (!profile) {
        navigate('/onboarding', { replace: true });
      } else {
        // User has profile - go to home (which will redirect to /plan/new if no plans)
        navigate('/home', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
      <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 animate-pulse-soft">
        <Rocket className="w-8 h-8 text-primary-foreground" />
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-muted-foreground mt-3">Loading Kaamyab...</p>
    </div>
  );
};

export default Index;
