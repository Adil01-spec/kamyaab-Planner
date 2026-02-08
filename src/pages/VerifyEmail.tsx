import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot, 
  InputOTPSeparator 
} from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Send initial OTP on mount
  useEffect(() => {
    if (user?.email) {
      handleSendOTP(true);
    }
  }, [user?.email]);

  const handleSendOTP = async (isInitial = false) => {
    if (!user?.email) return;
    
    if (!isInitial) {
      setResendLoading(true);
    }

    try {
      const { error } = await supabase.functions.invoke('send-verification-otp', {
        body: { email: user.email },
      });

      if (error) throw error;

      if (!isInitial) {
        toast.success('Verification code sent!');
      }
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      if (!isInitial) {
        toast.error('Could not send verification code. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { code: otp },
      });

      if (error) throw error;

      if (data?.verified) {
        toast.success('Email verified!');
        await refreshProfile();
        navigate('/onboarding', { replace: true });
      } else {
        toast.error(data?.message || 'Invalid or expired code. Please try again.');
        setOtp('');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAuth = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={handleBackToAuth}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to login</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Verify your email
          </h1>
          <p className="text-muted-foreground">
            Please verify your email to continue planning.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a code to{' '}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center mb-6">
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={6}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          className="w-full h-12 text-base font-semibold"
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Verify Email'
          )}
        </Button>

        {/* Resend */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <button
            onClick={() => handleSendOTP(false)}
            disabled={resendLoading || resendCooldown > 0}
            className="inline-flex items-center gap-2 text-primary font-medium text-sm mt-2 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {resendCooldown > 0 
              ? `Resend in ${resendCooldown}s` 
              : 'Resend code'
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
