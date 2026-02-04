import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Eye, EyeOff, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import mountainTriumphImage from '@/assets/auth-mountain-triumph.png';
import rocketLaunchImage from '@/assets/auth-rocket-launch.png';
import { isSafari } from '@/utils/isSafari';

type AuthView = 'login' | 'signup' | 'forgot-password';

const quotes = {
  login: {
    text: "Every champion was once",
    highlight: "a contender",
    rest: "who refused to",
    highlight2: "give up",
    author: "Rocky Balboa"
  },
  signup: {
    text: "The only limit to our",
    highlight: "realization of tomorrow",
    rest: "is our",
    highlight2: "doubts of today",
    author: "Franklin D. Roosevelt"
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
  const [appleLoading, setAppleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  // Detect Safari browser (memoized to avoid recalculating on every render)
  const isSafariBrowser = useMemo(() => isSafari(), []);

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
    // Prevent Google auth on Safari due to OAuth redirect limitations
    if (isSafariBrowser) {
      toast.error('Google Sign-In is not supported on Safari. Please use Email login or Apple Sign-In.');
      return;
    }
    
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

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      // On iOS Safari, use direct Supabase OAuth with skipBrowserRedirect
      // to bypass auth-bridge issues with third-party cookies
      if (isSafariBrowser) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/onboarding`,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          toast.error(error.message || 'Apple sign-in failed. Please try again.');
          return;
        }

        // Manually redirect to the OAuth URL
        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        // On non-Safari browsers, use the Lovable Cloud auth bridge
        const { error } = await lovable.auth.signInWithOAuth('apple', {
          redirect_uri: `${window.location.origin}/onboarding`,
        });
        if (error) {
          toast.error(error.message || 'Apple sign-in failed. Please try again.');
        }
      }
    } catch (error: any) {
      toast.error('Apple sign-in failed. Please try again.');
    } finally {
      setAppleLoading(false);
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

  // Form content (kept as JSX element to avoid remounting on each keystroke)
  const formContent = (
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
          <div className="flex flex-col gap-3">
            {/* Apple Sign-In - works on all browsers */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-xl border-2 hover:bg-accent/50 transition-all"
              onClick={handleAppleSignIn}
              disabled={loading || appleLoading}
            >
              {appleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </>
              )}
            </Button>

            {/* Google Sign-In - only show on non-Safari browsers */}
            {!isSafariBrowser && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 text-base font-medium rounded-xl border-2 hover:bg-accent/50 transition-all"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || appleLoading}
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
            )}
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

  // Parallax mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  // Transform values for parallax layers
  const quoteX = useTransform(smoothMouseX, [-0.5, 0.5], [15, -15]);
  const quoteY = useTransform(smoothMouseY, [-0.5, 0.5], [10, -10]);
  const bgX = useTransform(smoothMouseX, [-0.5, 0.5], [-20, 20]);
  const bgY = useTransform(smoothMouseY, [-0.5, 0.5], [-15, 15]);
  const decorX = useTransform(smoothMouseX, [-0.5, 0.5], [25, -25]);
  const decorY = useTransform(smoothMouseY, [-0.5, 0.5], [20, -20]);
  const glowX = useTransform(smoothMouseX, [-0.5, 0.5], [-30, 30]);
  const glowY = useTransform(smoothMouseY, [-0.5, 0.5], [-25, 25]);
  const imageX = useTransform(smoothMouseX, [-0.5, 0.5], [12, -12]);
  const imageY = useTransform(smoothMouseY, [-0.5, 0.5], [8, -8]);
  
  // Select image based on view
  const currentImage = view === 'signup' ? rocketLaunchImage : mountainTriumphImage;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Quote panel (kept as JSX element to avoid remounting on each keystroke)
  const quotePanel = (
    <motion.div
      key={view === 'signup' ? 'signup-quote' : 'login-quote'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col justify-center items-center p-8 lg:p-16 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background gradient overlay with parallax */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-muted/20"
        style={{ x: bgX, y: bgY }}
      />
      
      {/* Floating glow orb with parallax */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"
        style={{ 
          x: glowX, 
          y: glowY,
          top: '20%',
          right: '10%'
        }}
      />
      
      {/* Secondary glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-accent/10 blur-2xl pointer-events-none"
        style={{ 
          x: useTransform(smoothMouseX, [-0.5, 0.5], [20, -20]), 
          y: useTransform(smoothMouseY, [-0.5, 0.5], [15, -15]),
          bottom: '15%',
          left: '5%'
        }}
      />
      
      {/* Decorative quote mark with parallax */}
      <motion.div 
        className="absolute top-12 left-12 text-muted-foreground/10 text-[150px] font-serif leading-none select-none"
        style={{ x: decorX, y: decorY }}
      >
        "
      </motion.div>
      
      {/* Quote content with parallax */}
      <motion.div 
        className="relative z-10 max-w-lg text-center lg:text-left"
        style={{ x: quoteX, y: quoteY }}
      >
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
      </motion.div>
      
      {/* Full-cover background illustration with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view === 'signup' ? 'rocket' : 'mountain'}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
          style={{ x: imageX, y: imageY }}
        >
          <img 
            src={currentImage} 
            alt="Decorative illustration"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-background/30 pointer-events-none" />
    </motion.div>
  );

  // Mobile form content is now inlined in the JSX to prevent re-renders on typing

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      {/* Mobile Layout - Full Page Background */}
      <div className="flex lg:hidden flex-col w-full min-h-screen relative">
        {/* Full-page Background Illustration with Crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view === 'signup' ? 'rocket-mobile' : 'mountain-mobile'}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img 
              src={currentImage} 
              alt="Decorative illustration"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/95 pointer-events-none" />
        
        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col px-5 pt-8 pb-6 safe-area-bottom">
          {/* Quote Card at Top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-auto"
          >
            <div className="backdrop-blur-xl bg-foreground/5 border border-foreground/10 rounded-2xl p-5 shadow-lg">
              <p className="text-base font-medium text-foreground leading-relaxed">
                "{currentQuote.text} <span className="text-primary font-bold">{currentQuote.highlight}</span> {currentQuote.rest} <span className="text-primary font-bold">{currentQuote.highlight2}</span>."
              </p>
              <p className="text-sm text-muted-foreground mt-3">– {currentQuote.author}</p>
            </div>
          </motion.div>
          
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="backdrop-blur-xl bg-foreground/5 border border-foreground/10 rounded-3xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-5">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={view}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-foreground"
                >
                  {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
                </motion.h1>
              </AnimatePresence>
              <p className="text-sm text-muted-foreground mt-1">
                {view === 'login' ? 'Sign in to continue your journey' : view === 'signup' ? 'Start your journey with us' : 'We\'ll help you get back in'}
              </p>
            </div>
            
            {/* Form Content - Inlined to prevent re-renders */}
            <div className="w-full">
              {view === 'forgot-password' ? (
                <>
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to login</span>
                  </button>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-13 text-base rounded-xl border border-foreground/10 focus:border-primary/50 transition-colors backdrop-blur-md bg-foreground/5"
                        disabled={loading}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-13 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
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
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-13 text-base rounded-xl border border-foreground/10 focus:border-primary/50 transition-colors backdrop-blur-md bg-foreground/5"
                        disabled={loading}
                      />
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-13 text-base rounded-xl border border-foreground/10 focus:border-primary/50 transition-colors backdrop-blur-md bg-foreground/5"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {view === 'signup' && (
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 pr-12 h-13 text-base rounded-xl border border-foreground/10 focus:border-primary/50 transition-colors backdrop-blur-md bg-foreground/5"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-13 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        view === 'login' ? 'Log In' : 'Create Account'
                      )}
                    </Button>

                    {view === 'login' && (
                      <div className="text-center pt-1">
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
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-foreground/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 text-sm text-muted-foreground backdrop-blur-sm">or continue with</span>
                    </div>
                  </div>

                  {/* Google Login */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-13 text-base font-medium rounded-xl border border-foreground/10 backdrop-blur-md bg-foreground/5 hover:bg-foreground/10 transition-all"
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
                </>
              )}
            </div>
          </motion.div>
          
          {/* Switch View Footer */}
          {view !== 'forgot-password' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-5 text-center"
            >
              <p className="text-sm text-foreground/80">
                {view === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
                  className="ml-1 text-primary font-semibold hover:underline"
                  disabled={loading}
                >
                  {view === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Split screen with animated panel swap */}
      <div className="hidden lg:flex flex-1 relative">
        <AnimatePresence mode="wait" initial={false}>
          {isLoginView
            ? [
                // Login: Form Left, Quote Right
                <motion.div
                  key="login-form-panel"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-1/2 flex items-center justify-center bg-background"
                >
                  {formContent}
                </motion.div>,
                <motion.div
                  key="login-quote-panel"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-1/2 bg-muted/30"
                >
                  {quotePanel}
                </motion.div>,
              ]
            : [
                // Signup: Quote Left, Form Right
                <motion.div
                  key="signup-quote-panel"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-1/2 bg-muted/30"
                >
                  {quotePanel}
                </motion.div>,
                <motion.div
                  key="signup-form-panel"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="w-1/2 flex items-center justify-center bg-background"
                >
                  {formContent}
                </motion.div>,
              ]}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
