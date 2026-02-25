import { useEffect, useState } from 'react';
import heroMockup from '@/assets/hero-mockup.png';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Rocket, Target, Timer, Brain, AlertTriangle, Map, TrendingUp, Briefcase, Code, GraduationCap, Palette, ArrowRight, CheckCircle, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { LandingHeader } from '@/components/LandingHeader';
import { ConsistencyScoreRing } from '@/components/ConsistencyScoreRing';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';

const comparisonData = [
  { feature: 'AI-generated structured plans', kaamyab: true, todo: false, notion: false, habit: false, detail: 'Describe your goal — AI builds a week-by-week execution plan instantly.' },
  { feature: 'Milestone-driven execution', kaamyab: true, todo: false, notion: 'partial' as const, habit: false, detail: 'Tasks are sequenced into milestones, not dumped into a flat list.' },
  { feature: 'Adaptive refinement', kaamyab: true, todo: false, notion: false, habit: false, detail: 'Plans restructure based on your actual execution pace.' },
  { feature: 'Execution tracking & insights', kaamyab: true, todo: 'partial' as const, notion: false, habit: 'partial' as const, detail: 'Every task is timed with a 4-state system: idle, doing, paused, done.' },
  { feature: 'Strategic risk assessment', kaamyab: true, todo: false, notion: false, habit: false, detail: 'AI surfaces risks and assumptions before you start executing.' },
  { feature: 'Week-by-week pacing', kaamyab: true, todo: false, notion: 'partial' as const, habit: true, detail: 'Realistic weekly workload distribution, not arbitrary deadlines.' },
  { feature: 'Adaptive behavioral memory', kaamyab: true, todo: false, notion: false, habit: false, detail: 'Learns your patterns over time and adjusts future plans accordingly.' },
];

type CellValue = boolean | 'partial';

const CellIcon = ({ val, isKaamyab }: { val: CellValue; isKaamyab?: boolean }) => {
  if (val === true) return <CheckCircle className={`w-5 h-5 mx-auto ${isKaamyab ? 'text-primary' : 'text-primary'}`} />;
  if (val === 'partial') return <Minus className="w-5 h-5 text-muted-foreground mx-auto" />;
  return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
};

const ComparisonRow = ({ row }: { row: typeof comparisonData[0] }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <tr
        className="border-b border-border/50 cursor-default"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td className="py-3 px-4 text-foreground">{row.feature}</td>
        <td className="text-center py-3 px-4">
          <div className={`transition-all duration-300 ${hovered ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' : ''}`}>
            <CellIcon val={row.kaamyab} isKaamyab />
          </div>
        </td>
        <td className="text-center py-3 px-4"><CellIcon val={row.todo} /></td>
        <td className="text-center py-3 px-4"><CellIcon val={row.notion} /></td>
        <td className="text-center py-3 px-4"><CellIcon val={row.habit} /></td>
      </tr>
      <AnimatePresence>
        {hovered && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <td colSpan={5} className="px-4 pb-3 pt-0">
              <p className="text-xs text-muted-foreground italic">{row.detail}</p>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const ComparisonCard = ({ row }: { row: typeof comparisonData[0] }) => {
  const competitors = [
    { label: 'Todo Apps', val: row.todo },
    { label: 'Notion', val: row.notion },
    { label: 'Habit Trackers', val: row.habit },
  ];
  return (
    <article className="scroll-reveal-child glass-card rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-foreground leading-snug">{row.feature}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium text-primary">Kaamyab</span>
          <CellIcon val={row.kaamyab} isKaamyab />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{row.detail}</p>
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        {competitors.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <CellIcon val={c.val} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Scroll reveal refs
  const problemHeadingRef = useScrollReveal();
  const problemCardsRef = useScrollReveal();
  const stepsHeadingRef = useScrollReveal();
  const stepsCardsRef = useScrollReveal();
  const strategicRef = useScrollReveal();
  const useCasesHeadingRef = useScrollReveal();
  const useCasesCardsRef = useScrollReveal();
  const comparisonHeadingRef = useScrollReveal();
  const comparisonTableRef = useScrollReveal();
  const ctaRef = useScrollReveal();

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

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
                Define your objective. Kaamyab generates a milestone-driven plan with{' '}
                <strong className="text-foreground">deterministic execution speed</strong>, so you proceed with clarity, not chaos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="text-base px-8">
                  <Link to="/auth">Start Free <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  See How It Works
                </Button>
              </div>
            </div>
            <div className="mt-14 md:mt-20 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
              <div className="rounded-xl overflow-hidden shadow-2xl border border-border/30 ring-1 ring-primary/10">
                <img
                  src={heroMockup}
                  alt="Kaamyab app dashboard showing weekly plan with milestones, task progress, and consistency score"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={problemHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Most Goals Fail</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ambition alone doesn't create results. Without a system, goals stay wishes.
              </p>
            </div>
            <div ref={problemCardsRef} className="scroll-reveal scroll-reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: AlertTriangle,
                  title: 'No Structure',
                  desc: 'Goals without milestones become overwhelming. You don\'t know what to do first, second, or next.',
                  contrast: 'Kaamyab replaces guesswork with deterministic task sequencing — each step is computed, not assumed.',
                },
                {
                  icon: Map,
                  title: 'No Roadmap',
                  desc: 'Without a sequence of steps, effort scatters. You work hard but never move forward.',
                  contrast: 'Kaamyab\'s adaptive behavioral memory learns your pace and restructures your path automatically.',
                },
                {
                  icon: TrendingUp,
                  title: 'Inconsistent Action',
                  desc: 'Motivation fades. Without an adaptive plan that adjusts to reality, progress stalls.',
                  contrast: 'Kaamyab tracks execution state (idle, doing, paused, done) — not feelings — to maintain momentum.',
                },
              ].map((item) => (
                <article key={item.title} className="scroll-reveal-child glass-card rounded-xl p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.desc}</p>
                  <p className="text-sm leading-relaxed text-primary font-medium">{item.contrast}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works — Generate / Execute / Adapt */}
        <section id="how-it-works" className="py-20 gradient-subtle">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={stepsHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Kaamyab Works</h2>
              <p className="text-muted-foreground text-lg">Three phases from idea to execution.</p>
            </div>
            <div ref={stepsCardsRef} className="scroll-reveal scroll-reveal-stagger relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Connecting line on desktop */}
              <div className="hidden md:block absolute top-[4.5rem] left-[16.6%] right-[16.6%] h-px bg-border z-0" />

              {[
                { icon: Target, step: '01', title: 'Generate', desc: 'Describe your objective. AI builds a structured, milestone-driven execution plan with week-by-week pacing.' },
                { icon: Timer, step: '02', title: 'Execute', desc: 'Track tasks with a 4-state timer (idle, doing, paused, done). Every action is measured, not just listed.' },
                { icon: Brain, step: '03', title: 'Adapt', desc: 'Behavioral memory learns your patterns. Plans adjust to reality — not the other way around.' },
              ].map((item) => (
                <article key={item.step} className="scroll-reveal-child glass-card rounded-xl p-8 text-center interactive-card relative z-10">
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
          <div className="container max-w-4xl mx-auto px-4">
            <article ref={strategicRef} className="scroll-reveal glass-card rounded-2xl p-8 md:p-12">
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

        {/* Consistency Score */}
        <ConsistencyScoreRing />

        {/* Use Cases */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={useCasesHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Can You Plan?</h2>
              <p className="text-muted-foreground text-lg">From professional milestones to personal growth — structured execution for any goal.</p>
            </div>
            <div ref={useCasesCardsRef} className="scroll-reveal scroll-reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Briefcase, title: 'Build a Startup Roadmap', desc: 'Break your launch into phased milestones — from MVP to market entry.' },
                { icon: Code, title: 'Learn Coding in 90 Days', desc: 'Structured learning path with weekly skill targets and project checkpoints.' },
                { icon: GraduationCap, title: 'Prepare for Exams', desc: 'Subject-wise study plans with revision cycles and practice schedules.' },
                { icon: TrendingUp, title: 'Launch a Freelance Career', desc: 'Portfolio building, client acquisition, and income milestones — step by step.' },
                { icon: Palette, title: 'Personal Skill Development', desc: 'Creative, athletic, or professional — structured practice with adaptive pacing.' },
              ].map((item) => (
                <article key={item.title} className="scroll-reveal-child glass-card rounded-xl p-6 glass-card-hover">
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
        <section className="py-20 gradient-subtle">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={comparisonHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Kaamyab Compares</h2>
              <p className="text-muted-foreground text-lg">Not another to-do app. A structured execution system.</p>
            </div>
            {/* Desktop table */}
            <div ref={comparisonTableRef} className="scroll-reveal hidden md:block overflow-x-auto">
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
                  {comparisonData.map((row) => (
                    <ComparisonRow key={row.feature} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile stacked cards */}
            <div className="scroll-reveal scroll-reveal-stagger grid grid-cols-1 gap-4 md:hidden">
              {comparisonData.map((row) => (
                <ComparisonCard key={row.feature} row={row} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-background">
          <div ref={ctaRef} className="scroll-reveal container max-w-3xl mx-auto px-4 text-center">
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
