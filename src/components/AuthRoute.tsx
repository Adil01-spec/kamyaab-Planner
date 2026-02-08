import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Rocket } from 'lucide-react';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { user, profile, loading, isEmailVerified, isOAuthUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 animate-pulse-soft">
          <Rocket className="w-8 h-8 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading...</p>
      </div>
    );
  }

  // If user is logged in, redirect based on profile and verification status
  if (user) {
    // Email/password users without verification go to verify-email
    if (!isOAuthUser && !isEmailVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    
    if (profile) {
      return <Navigate to="/today" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
