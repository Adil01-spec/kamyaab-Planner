import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSoftCollabSession } from '@/hooks/useSoftCollabSession';
import { Loader2, Eye, MessageSquare, AlertCircle, Clock, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
  const { saveSession } = useSoftCollabSession();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

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
        setEmail(data.collaborator_email || '');
      } catch {
        setError('Unable to validate invitation.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleVerify = async () => {
    if (!token || !email.trim() || !accessKey) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-soft-invite', {
        body: { token, email: email.trim(), access_key: accessKey },
      });

      if (fnError) {
        throw new Error('Verification failed');
      }

      if (data?.error) {
        setVerifyError(data.error);
        if (data.attempts_remaining !== undefined) {
          setAttemptsRemaining(data.attempts_remaining);
        }
        return;
      }

      // Success — save soft session and redirect
      saveSession({
        sessionToken: data.session_token,
        planId: data.plan_id,
        role: data.role,
      });

      navigate(`/plan/${data.plan_id}/review`, { replace: true });
    } catch {
      setVerifyError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Full-page loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <img src={kaamyabLogo} alt="Kamyaab" className="w-14 h-14 rounded-2xl object-contain mb-4" />
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3 text-sm">Validating invitation…</p>
      </div>
    );
  }

  // Error state
  if (error || !inviteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-10 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Invitation Unavailable</h2>
            <p className="text-sm text-muted-foreground text-center">
              {error || 'This invitation has expired or is no longer valid.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresIn = formatDistanceToNow(new Date(inviteData.expires_at), { addSuffix: false });
  const RoleIcon = inviteData.role === 'commenter' ? MessageSquare : Eye;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
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

          {/* Verification form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={verifying}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Access Key
              </label>
              <p className="text-xs text-muted-foreground">
                Enter the 5-digit key from your invitation email
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={5}
                  value={accessKey}
                  onChange={setAccessKey}
                  disabled={verifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || !email.trim() || accessKey.length < 5}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify & Access Plan'
              )}
            </Button>

            {verifyError && (
              <div className="text-sm text-destructive text-center space-y-1">
                <p>{verifyError}</p>
                {attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info note */}
          <p className="text-xs text-muted-foreground text-center">
            No account required. Your access is scoped to this plan only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
