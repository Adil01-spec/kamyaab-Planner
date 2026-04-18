import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { LandingHeader } from '@/components/LandingHeader';
import { FAQSection } from '@/components/FAQSection';
import SEO from '@/components/SEO';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';
import { DifferentiationSection } from '@/components/landing/DifferentiationSection';
import { TrustSignalsSection } from '@/components/landing/TrustSignalsSection';
import { SEOContentSection } from '@/components/landing/SEOContentSection';

// App screenshots
import todayView from '@/assets/screenshots/today-view.png';
import planView from '@/assets/screenshots/plan-view.png';
import reviewView from '@/assets/screenshots/review-view.png';

/* ─── Scroll-reveal section wrapper ─── */
const RevealSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Floating app screenshot with perspective tilt ─── */
const AppScreenshot = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group ${className}`}
      style={{ perspective: '1200px' }}
    >
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-border/20 transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
        }}
      >
        <img src={src} alt={alt} className="w-full h-auto" loading="lazy" />
      </div>
      <div className="absolute -inset-4 -z-10 bg-primary/5 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

/* ─── Page ─── */
const LandingContent = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ overflowX: 'clip' }}>
      <SEO 
        title="KAMYAAB AI | The Execution Intelligence System for Builders"
        description="Stop over-planning and start executing. KAMYAAB AI generates structured multi-week plans, tracks execution with deep-work timers, and syncs with your Google & Apple calendars."
        canonical="/"
      />
      <LandingHeader />

      <main>
        {/* ═══ HERO ═══ */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-[100px]" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/[0.06] blur-[100px]" />
          </div>

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="container max-w-5xl mx-auto px-4 pt-8 pb-16"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-sm font-medium text-muted-foreground tracking-wide mb-6"
              >
                For people who finish what they start
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6"
              >
                Your plans deserve
                <br />
                <span className="text-primary">better than a to-do list.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto"
              >
                KAMYAAB AI turns your goals into structured weekly plans and tracks your execution — so you actually finish what you start.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col items-center justify-center gap-3"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg" className="text-base px-8 h-12 rounded-xl">
                    <Link to="/auth?mode=signup">
                      Start for free <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-base px-6 h-12 text-muted-foreground hover:text-foreground"
                    onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    See how it works ↓
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Generate your first plan in under 60 seconds · No credit card required
                </p>
              </motion.div>
            </div>

            {/* Hero Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 md:mt-20 max-w-4xl mx-auto"
            >
              <AppScreenshot
                src={todayView}
                alt="KAMYAAB daily focus view showing today's tasks, progress ring, and weekly milestone tracking"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ DIFFERENTIATION ═══ */}
        <DifferentiationSection />

        {/* ═══ APP SHOWCASE ═══ */}
        <section id="showcase" className="py-24 md:py-32 border-t border-border/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 md:mb-32">
              <RevealSection className="order-2 lg:order-1">
                <AppScreenshot src={planView} alt="AI-generated structured weekly execution plan with progress tracking" />
              </RevealSection>
              <RevealSection className="order-1 lg:order-2" delay={0.15}>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Your Plan</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">AI-generated structured weekly plan.</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">Describe your goal — get a structured multi-week plan with milestones, deadlines, and progress tracking. No blank pages, no guesswork.</p>
              </RevealSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 md:mb-32">
              <RevealSection delay={0.1}>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Daily Focus</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">Track your execution daily.</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">See exactly what to work on today. Track time, mark progress, and stay on pace without overthinking.</p>
              </RevealSection>
              <RevealSection delay={0.25}>
                <AppScreenshot src={todayView} alt="Daily task focus view with progress indicators and execution tracking" />
              </RevealSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <RevealSection className="order-2 lg:order-1">
                <AppScreenshot src={reviewView} alt="Review dashboard with strategy insights, reality check, and execution analytics" />
              </RevealSection>
              <RevealSection className="order-1 lg:order-2" delay={0.15}>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Review & Adapt</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">Review your real progress, not guesses.</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">AI-powered insights on your execution patterns. What is working, what is slipping, and what to adjust — no guessing.</p>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="py-24 md:py-32 border-t border-border/30">
          <div className="container max-w-4xl mx-auto px-4">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Three steps. That's it.</h2>
              <p className="text-muted-foreground text-lg">No learning curve. No setup complexity.</p>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { num: '01', title: 'Define your goal', desc: 'Tell AI what you want to achieve and your deadline. It builds the plan for you.' },
                { num: '02', title: 'Get a structured execution plan', desc: 'Each week has clear tasks, milestones, and deadlines. Track them with built-in timers.' },
                { num: '03', title: 'Stay consistent with real tracking', desc: 'See your execution patterns. Plans adapt based on how you actually work.' },
              ].map((step, i) => (
                <RevealSection key={step.num} delay={i * 0.12}>
                  <div className="text-center">
                    <span className="inline-block text-5xl md:text-6xl font-extrabold text-primary/15 mb-4 select-none">{step.num}</span>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-16 border-t border-border/30">
          <div className="container max-w-4xl mx-auto px-4">
            <RevealSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '12', label: 'Week plans' },
                  { value: '49+', label: 'Tasks per plan' },
                  { value: '4', label: 'Task states tracked' },
                  { value: '∞', label: 'Plans — free tier' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ═══ BUILT FOR ═══ */}
        <section className="py-24 md:py-32 border-t border-border/30">
          <div className="container max-w-4xl mx-auto px-4">
            <RevealSection className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Built for people who ship.</h2>
              <p className="text-muted-foreground text-lg">If any of these sound like you, Kamyaab was made for this.</p>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { emoji: '🔄', title: "People who start but don't finish", desc: 'You have ideas and ambition, but plans fade after the first week. Kamyaab keeps you moving forward.' },
                { emoji: '🧠', title: 'Overthinkers stuck in planning', desc: 'You spend more time organizing than doing. Kamyaab gives you a plan so you can skip to execution.' },
                { emoji: '📉', title: 'High potential, low consistency', desc: 'You know you can do it — you just struggle to stay on track. Structured weekly plans change that.' },
                { emoji: '🚀', title: 'Builders ready to ship', desc: 'Side projects, MVPs, career goals — stop treating them like someday tasks. Give them a real timeline.' },
              ].map((item, i) => (
                <RevealSection key={item.title} delay={i * 0.08}>
                  <div className="rounded-2xl border border-border/50 p-6 hover:border-primary/20 transition-colors duration-300">
                    <span className="text-2xl mb-3 block">{item.emoji}</span>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <TrustSignalsSection />

        {/* ═══ FINAL CTA ═══ */}
        <section className="py-24 md:py-32">
          <div className="container max-w-3xl mx-auto px-4">
            <RevealSection className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-5">Stop planning.<br />Start finishing.</h2>
              <p className="text-muted-foreground text-lg mb-2 max-w-md mx-auto">Create your first plan in under a minute.</p>
              <p className="text-muted-foreground text-sm mb-8">Free to start. No credit card required.</p>
              <Button asChild size="lg" className="text-base px-10 h-12 rounded-xl">
                <Link to="/auth?mode=signup">Get started <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </RevealSection>
          </div>
        </section>

        <section className="py-8 border-t border-border/30">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <p className="text-muted-foreground text-sm">
              Standard is free forever.{' '}
              <Link to="/pricing" className="text-primary hover:underline font-medium">See all plans →</Link>
            </p>
          </div>
        </section>

        <SEOContentSection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) return;
      if (!profile) navigate('/onboarding', { replace: true });
      else navigate('/today', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <img src={kaamyabLogo} alt="KAMYAAB" className="w-16 h-16 rounded-2xl object-contain mb-4 animate-pulse" />
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading KAMYAAB...</p>
      </div>
    );
  }

  if (user) return null;

  return <LandingContent />;
};

export default Index;
