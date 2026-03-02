import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserPlus, Eye, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';
import { formatDistanceToNow } from 'date-fns';

interface InviteData {
  plan_name: string;
  inviter_name: string;
  role: 'viewer' | 'commenter';
  collaborator_email: string;
  expires_at: string;
}

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Validate invite on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('validate-invite', {
          body: { token },
        });

        if (fnError || !data?.valid) {
          setError(data?.error || 'This invitation has expired or is no longer valid.');
          return;
        }

        setInviteData(data as InviteData);
      } catch {
        setError('Unable to validate invitation.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('accept-invite', {
        body: { token },
      });

      if (fnError) {
        throw new Error('Failed to accept invite');
      }

      if (data?.error === 'email_mismatch') {
        setAcceptError(
          `This invitation was sent to ${data.expected_email}. Please log in with that email address.`
        );
        return;
      }

      if (data?.error) {
        setAcceptError(data.error);
        return;
      }

      // Clear any pending token
      localStorage.removeItem('pending_invite_token');

      // Redirect to review page
      navigate('/review', { replace: true });
    } catch {
      setAcceptError('Something went wrong. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleGoToAuth = (mode: 'login' | 'signup') => {
    // Store token so post-auth redirect works
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
    navigate(`/auth?mode=${mode === 'signup' ? 'signup' : ''}&invite=${token}`);
  };

  // Full-page loading
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <img src={kaamyabLogo} alt="Kamyaab" className="w-14 h-14 rounded-2xl object-contain mb-4" />
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3 text-sm">Validating invitation…</p>
      </div>
    );
  }

  // Error state
  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-10 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Invitation Unavailable</h2>
            <p className="text-sm text-muted-foreground text-center">
              {error || 'This invitation has expired or is no longer valid.'}
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-2">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresIn = formatDistanceToNow(new Date(inviteData.expires_at), { addSuffix: false });
  const RoleIcon = inviteData.role === 'commenter' ? MessageSquare : Eye;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <img src={kaamyabLogo} alt="Kamyaab" className="w-12 h-12 rounded-xl object-contain mx-auto mb-3" />
          <CardTitle className="text-xl">You're Invited to Collaborate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Invite details */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
              <p className="text-base font-medium text-foreground">{inviteData.plan_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Invited by</p>
              <p className="text-base font-medium text-foreground">{inviteData.inviter_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Role</p>
                <Badge variant="secondary" className="mt-1 gap-1">
                  <RoleIcon className="w-3 h-3" />
                  {inviteData.role === 'commenter' ? 'Commenter' : 'Viewer'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Expires in {expiresIn}
              </div>
            </div>
          </div>

          {/* Auth-aware actions */}
          {user ? (
            <div className="space-y-3">
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              {acceptError && (
                <p className="text-sm text-destructive text-center">{acceptError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in with <strong>{inviteData.collaborator_email}</strong> to access this plan.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleGoToAuth('login')} className="flex-1">
                  Sign In
                </Button>
                <Button onClick={() => handleGoToAuth('signup')} variant="outline" className="flex-1">
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
