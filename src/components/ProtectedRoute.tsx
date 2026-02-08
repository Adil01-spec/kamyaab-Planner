import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Rocket } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  redirectIfProfile?: string;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireProfile = false,
  redirectIfProfile,
  requireEmailVerification = false,
}) => {
  const { user, profile, loading, isEmailVerified, isOAuthUser } = useAuth();
  const location = useLocation();

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

  // No user → redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check email verification for email/password users
  // OAuth users (Google/Apple) skip OTP as they're already verified
  if (requireEmailVerification && !isOAuthUser && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // If this route should redirect when profile exists (e.g., onboarding)
  if (redirectIfProfile && profile) {
    return <Navigate to={redirectIfProfile} replace />;
  }

  // User exists but no profile and we require profile → redirect to onboarding
  if (requireProfile && !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
