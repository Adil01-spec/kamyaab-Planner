import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Rocket, Target, Route, RefreshCw, AlertTriangle, Map, TrendingUp, Briefcase, Code, GraduationCap, Palette, ArrowRight, CheckCircle, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

const useFadeInOnScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0');
          el.classList.remove('opacity-0', 'translate-y-6');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const problemRef = useFadeInOnScroll();
  const howItWorksRef = useFadeInOnScroll();
  const strategicRef = useFadeInOnScroll();
  const useCasesRef = useFadeInOnScroll();
  const comparisonRef = useFadeInOnScroll();
  const ctaRef = useFadeInOnScroll();

  useEffect(() => {
    if (!loading) {
      if (!user) return;
      if (!profile) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/today', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-subtle">
        <div className="w-16 h-16 rounded-2xl gradient-kaamyab flex items-center justify-center mb-4 animate-pulse-soft">
          <Rocket className="w-8 h-8 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading Kaamyab...</p>
      </div>
    );
  }

  if (user) return null;

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-subtle">
          <div className="container max-w-6xl mx-auto px-4 py-20 md:py-32">
            <div className="max-w-3xl mx-auto text-center animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Rocket className="w-4 h-4" />
                AI-Powered Execution System
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
                Turn Goals Into Structured Action Plans
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                Define your objective. Kaamyab generates a milestone-driven plan with adaptive strategy — so you execute with clarity, not chaos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="text-base px-8">
                  <Link to="/auth">Start Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8" onClick={scrollToHowItWorks}>
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-background">
          <div ref={problemRef} className="container max-w-5xl mx-auto px-4 opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Most Goals Fail</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ambition alone doesn't create results. Without a system, goals stay wishes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: AlertTriangle, title: 'No Structure', desc: 'Goals without milestones become overwhelming. You don\'t know what to do first, second, or next.' },
                { icon: Map, title: 'No Roadmap', desc: 'Without a sequence of steps, effort scatters. You work hard but never move forward.' },
                { icon: TrendingUp, title: 'Inconsistent Action', desc: 'Motivation fades. Without an adaptive plan that adjusts to reality, progress stalls.' },
              ].map((item) => (
                <article key={item.title} className="glass-card rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 gradient-subtle">
          <div ref={howItWorksRef} className="container max-w-5xl mx-auto px-4 opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Kaamyab Works</h2>
              <p className="text-muted-foreground text-lg">Three steps from idea to execution.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Target, step: '01', title: 'Define Your Goal', desc: 'Tell Kaamyab what you want to achieve, your timeline, and context. No templates — your goal, your plan.' },
                { icon: Route, step: '02', title: 'Get a Structured Plan', desc: 'AI generates a week-by-week execution plan with prioritized tasks, milestones, and realistic pacing.' },
                { icon: RefreshCw, step: '03', title: 'Adaptive Refinement', desc: 'As you execute, Kaamyab tracks progress and surfaces insights to keep your plan aligned with reality.' },
              ].map((item) => (
                <article key={item.step} className="glass-card rounded-xl p-8 text-center interactive-card">
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">STEP {item.step}</div>
                  <div className="w-14 h-14 rounded-2xl gradient-kaamyab flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Strategic Planning Highlight */}
        <section className="py-20 bg-background">
          <div ref={strategicRef} className="container max-w-4xl mx-auto px-4 opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <article className="glass-card rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Strategic Planning, Not Just Task Lists</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Kaamyab doesn&apos;t just break goals into tasks. It builds a high-level roadmap with risk assumptions, milestone architecture, and execution sequencing. You understand not just <em>what</em> to do, but <em>why</em> each step matters and how it connects to the bigger picture.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The free tier gives you structured plans with intelligent task generation. For teams and complex projects, advanced strategic refinement — including scenario analysis and deeper AI-driven insights — is available through a subscription.
              </p>
            </article>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 gradient-subtle">
          <div ref={useCasesRef} className="container max-w-5xl mx-auto px-4 opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Can You Plan?</h2>
              <p className="text-muted-foreground text-lg">From professional milestones to personal growth — structured execution for any goal.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Briefcase, title: 'Build a Startup Roadmap', desc: 'Break your launch into phased milestones — from MVP to market entry.' },
                { icon: Code, title: 'Learn Coding in 90 Days', desc: 'Structured learning path with weekly skill targets and project checkpoints.' },
                { icon: GraduationCap, title: 'Prepare for Exams', desc: 'Subject-wise study plans with revision cycles and practice schedules.' },
                { icon: TrendingUp, title: 'Launch a Freelance Career', desc: 'Portfolio building, client acquisition, and income milestones — step by step.' },
                { icon: Palette, title: 'Personal Skill Development', desc: 'Creative, athletic, or professional — structured practice with adaptive pacing.' },
              ].map((item) => (
                <article key={item.title} className="glass-card rounded-xl p-6 glass-card-hover">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 bg-background">
          <div ref={comparisonRef} className="container max-w-5xl mx-auto px-4 opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Kaamyab Compares</h2>
              <p className="text-muted-foreground text-lg">Not another to-do app. A structured execution system.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">Kaamyab</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Todo Apps</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Notion Templates</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Habit Trackers</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI-generated structured plans', kaamyab: true, todo: false, notion: false, habit: false },
                    { feature: 'Milestone-driven execution', kaamyab: true, todo: false, notion: 'partial', habit: false },
                    { feature: 'Adaptive refinement', kaamyab: true, todo: false, notion: false, habit: false },
                    { feature: 'Execution tracking & insights', kaamyab: true, todo: 'partial', notion: false, habit: 'partial' },
                    { feature: 'Strategic risk assessment', kaamyab: true, todo: false, notion: false, habit: false },
                    { feature: 'Week-by-week pacing', kaamyab: true, todo: false, notion: 'partial', habit: true },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-border/50">
                      <td className="py-3 px-4 text-foreground">{row.feature}</td>
                      {[row.kaamyab, row.todo, row.notion, row.habit].map((val, i) => (
                        <td key={i} className="text-center py-3 px-4">
                          {val === true ? <CheckCircle className="w-5 h-5 text-primary mx-auto" /> :
                           val === 'partial' ? <Minus className="w-5 h-5 text-muted-foreground mx-auto" /> :
                           <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 gradient-subtle">
          <div ref={ctaRef} className="container max-w-3xl mx-auto px-4 text-center opacity-0 translate-y-6 transition-all duration-700 ease-out">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stop Planning in Your Head. Start Executing with Structure.
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Your goals deserve more than a checklist. Build a real plan, track real progress.
            </p>
            <Button asChild size="lg" className="text-base px-10">
              <Link to="/auth">Start Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <p className="text-muted-foreground text-sm mt-4">No credit card required.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
