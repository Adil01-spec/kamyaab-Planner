import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AuthView = 'login' | 'signup' | 'forgot-password';

const quotes = {
  login: {
    text: "The future belongs to those who",
    highlight: "believe",
    rest: "in the",
    highlight2: "beauty of their dreams",
    author: "Eleanor Roosevelt"
  },
  signup: {
    text: "The only way to",
    highlight: "do great work",
    rest: "is to",
    highlight2: "love what you do",
    author: "Steve Jobs"
  }
};

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const getErrorMessage = (error: any): string => {
    const message = error?.message || '';
    
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email before logging in.';
    }
    if (message.includes('User already registered')) {
      return 'Email already registered. Try logging in.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.';
    }
    if (message.includes('Invalid email')) {
      return 'Invalid email format.';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please try again later.';
    }
    
    return message || 'Authentication failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (view === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (view === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast.error(getErrorMessage(error));
          return;
        }
        toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          toast.error(getErrorMessage(error));
          return;
        }
        toast.success('Account created successfully!');
      }
      navigate('/onboarding');
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        toast.error(getErrorMessage(error));
        return;
      }
      
      toast.success('Password reset link sent! Check your email.');
      setView('login');
    } catch (error: any) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message?.includes('popup')) {
          toast.error('Popup was blocked. Please allow popups and try again.');
        } else {
          toast.error(error.message || 'Google sign-in failed. Please try again.');
        }
      }
    } catch (error: any) {
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    // Reset form when switching
    if (newView !== 'forgot-password') {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const currentQuote = view === 'signup' ? quotes.signup : quotes.login;
  const isLoginView = view === 'login' || view === 'forgot-password';

  // Form component
  const FormContent = () => (
    <motion.div
      key={view}
      initial={{ opacity: 0, x: isLoginView ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isLoginView ? 30 : -30 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full max-w-md mx-auto px-8 lg:px-12"
    >
      {view === 'forgot-password' ? (
        <>
          <button
            type="button"
            onClick={() => switchView('login')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link</p>
          
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors bg-background"
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">
            {view === 'login' ? 'Log In' : 'Sign Up'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors bg-background"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors bg-background"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {view === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base rounded-xl border-2 border-border/50 focus:border-primary/50 transition-colors bg-background"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                view === 'login' ? 'Log In' : 'Sign Up'
              )}
            </Button>

            {view === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchView('forgot-password')}
                  className="text-sm text-primary font-medium hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">or</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-base font-medium rounded-xl border-2 hover:bg-accent/50 transition-all"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </>
              )}
            </Button>
          </div>

          {/* Switch View */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
                className="ml-2 text-primary font-semibold hover:underline"
                disabled={loading}
              >
                {view === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </>
      )}
    </motion.div>
  );

  // Quote Panel component
  const QuotePanel = () => (
    <motion.div
      key={view === 'signup' ? 'signup-quote' : 'login-quote'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col justify-center items-center p-8 lg:p-16 relative overflow-hidden"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-muted/20" />
      
      {/* Decorative quote mark */}
      <div className="absolute top-12 left-12 text-muted-foreground/10 text-[150px] font-serif leading-none select-none">
        "
      </div>
      
      {/* Quote content */}
      <div className="relative z-10 max-w-lg text-center lg:text-left">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl lg:text-3xl font-medium text-foreground leading-relaxed"
        >
          {currentQuote.text}{' '}
          <span className="text-primary font-bold">{currentQuote.highlight}</span>{' '}
          {currentQuote.rest}{' '}
          <span className="text-primary font-bold">{currentQuote.highlight2}</span>.
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 text-lg text-muted-foreground"
        >
          – {currentQuote.author}
        </motion.p>
      </div>
      
      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      {/* Desktop only: Split screen with animated panel swap */}
      <div className="hidden lg:flex flex-1 relative">
        <AnimatePresence mode="wait">
          {isLoginView ? (
            <>
              {/* Login: Form Left, Quote Right */}
              <motion.div
                key="login-form-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-1/2 flex items-center justify-center bg-background"
              >
                <FormContent />
              </motion.div>
              <motion.div
                key="login-quote-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-1/2 bg-muted/30"
              >
                <QuotePanel />
              </motion.div>
            </>
          ) : (
            <>
              {/* Signup: Quote Left, Form Right */}
              <motion.div
                key="signup-quote-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-1/2 bg-muted/30"
              >
                <QuotePanel />
              </motion.div>
              <motion.div
                key="signup-form-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-1/2 flex items-center justify-center bg-background"
              >
                <FormContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
