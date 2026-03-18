import { useEffect } from 'react';
import heroMockup from '@/assets/hero-mockup.png';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, Target, Timer, Brain, AlertTriangle, Map, TrendingUp,
  ArrowRight, CheckCircle, X, Minus, GraduationCap, Briefcase, Code, Users,
  Gauge, Zap, Lock, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { LandingHeader } from '@/components/LandingHeader';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';

/* ─── Comparison Data ─── */
const comparisonData = [
  { feature: 'AI-generated structured plans', kaamyab: true, todo: false, notion: false, habit: false, detail: 'Describe your objective — AI builds a week-by-week execution plan.' },
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
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-primary">KAMYAAB</span>
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

/* ─── Page ─── */
const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const problemHeadingRef = useScrollReveal();
  const problemCardsRef = useScrollReveal();
  const stepsHeadingRef = useScrollReveal();
  const stepsCardsRef = useScrollReveal();
  const metricsRef = useScrollReveal();
  const audienceRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const strategicRef = useScrollReveal();
  const comparisonHeadingRef = useScrollReveal();
  const comparisonTableRef = useScrollReveal();
  const comparisonMobileRef = useScrollReveal();
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
        <img src={kaamyabLogo} alt="KAMYAAB" className="w-16 h-16 rounded-2xl object-contain mb-4 animate-pulse" />
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Loading KAMYAAB...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative overflow-hidden gradient-subtle">
          <div className="container max-w-6xl mx-auto px-4 py-20 md:py-32">
            <div className="max-w-3xl mx-auto text-center animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Target className="w-4 h-4" />
                Execution Intelligence System
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
                Structured Execution Intelligence
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                AI plans that actually get completed. Define your objective — KAMYAAB generates a locked execution plan with{' '}
                <strong className="text-foreground">deterministic execution speed</strong> and{' '}
                <strong className="text-foreground">adaptive behavioral memory</strong>.
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
                  See the System
                </Button>
              </div>
            </div>

            {/* Hero mockup with callouts */}
            <motion.div
              className="hidden md:block mt-14 md:mt-20 max-w-5xl mx-auto relative"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div className="hidden md:flex absolute -left-4 top-[38%] z-20 items-center gap-2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.2 }}>
                <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">Milestone Tasks</p>
                  <p className="text-[10px] text-muted-foreground">Week-by-week structured execution</p>
                </div>
                <div className="w-8 h-px bg-primary" />
              </motion.div>

              <motion.div className="hidden md:flex absolute -right-4 top-[24%] z-20 items-center gap-2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.4 }}>
                <div className="w-8 h-px bg-primary" />
                <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">Progress Ring</p>
                  <p className="text-[10px] text-muted-foreground">Visual completion tracking</p>
                </div>
              </motion.div>

              <motion.div className="hidden md:flex absolute -right-4 top-[68%] z-20 items-center gap-2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.6 }}>
                <div className="w-8 h-px bg-primary" />
                <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">Quick Actions</p>
                  <p className="text-[10px] text-muted-foreground">Jump to focus, plan, or review</p>
                </div>
              </motion.div>

              <motion.div className="hidden md:flex absolute -left-4 top-[78%] z-20 items-center gap-2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.8 }}>
                <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">Behavioral Memory Reminders</p>
                  <p className="text-[10px] text-muted-foreground">Adaptive execution cues based on your consistency history</p>
                </div>
                <div className="w-8 h-px bg-primary" />
              </motion.div>

              <motion.div
                className="rounded-xl overflow-hidden shadow-2xl border border-border/30 ring-1 ring-primary/10"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.015, rotateX: 2, rotateY: -1 }}
                style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
              >
                <img
                  src={heroMockup}
                  alt="KAMYAAB app showing structured execution plan with progress tracking"
                  className="w-full h-auto"
                  loading="eager"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ Problem Section ═══ */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={problemHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Most Plans Fail</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ambition without structure produces nothing. Without a system, plans stay wishes.
              </p>
            </div>
            <div ref={problemCardsRef} className="scroll-reveal scroll-reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: AlertTriangle,
                  title: 'No Structure',
                  desc: 'Plans without milestones become overwhelming. You don\'t know what to do first, second, or next.',
                  contrast: 'KAMYAAB replaces guesswork with deterministic task sequencing — each step is computed, not assumed.',
                },
                {
                  icon: Map,
                  title: 'No Roadmap',
                  desc: 'Without a sequence of steps, effort scatters. You work hard but never move forward.',
                  contrast: 'KAMYAAB\'s adaptive behavioral memory learns your pace and restructures your path automatically.',
                },
                {
                  icon: TrendingUp,
                  title: 'Inconsistent Execution',
                  desc: 'Without an adaptive plan that adjusts to reality, progress stalls and plans get abandoned.',
                  contrast: 'KAMYAAB tracks execution state (idle, doing, paused, done) — not feelings — to maintain forward progress.',
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

        {/* ═══ How KAMYAAB Works — Define / Execute / Adapt ═══ */}
        <section id="how-it-works" className="py-20 gradient-subtle">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={stepsHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How KAMYAAB Works</h2>
              <p className="text-muted-foreground text-lg">Three phases from objective to completed execution.</p>
            </div>
            <div ref={stepsCardsRef} className="scroll-reveal scroll-reveal-stagger relative grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="hidden md:block absolute top-[4.5rem] left-[16.6%] right-[16.6%] h-px bg-border z-0" />
              {[
                { icon: Target, step: '01', title: 'Define', desc: 'Describe your objective. AI generates a locked multi-week plan with milestone-driven task sequencing.' },
                { icon: Timer, step: '02', title: 'Execute', desc: 'Track every task with a 4-state timer and deterministic completion speed. Every action is measured.' },
                { icon: Brain, step: '03', title: 'Adapt', desc: 'Behavioral memory injection automatically refines every future plan based on your execution patterns.' },
              ].map((item) => (
                <article key={item.step} className="scroll-reveal-child glass-card rounded-xl p-8 text-center interactive-card relative z-10">
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">PHASE {item.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-[#166534] flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ What You Can Measure ═══ */}
        <section className="py-20 bg-background">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={metricsRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What You Can Measure</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Quantifiable execution data — not subjective feelings.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Gauge, label: 'Execution Consistency Score', desc: 'Your rolling completion reliability across plans.' },
                { icon: Zap, label: 'Average Completion Speed', desc: 'Deterministic speed calculation per task and milestone.' },
                { icon: Lock, label: 'Plan Lock Rate', desc: 'Percentage of plans executed without scope modification.' },
                { icon: Database, label: 'Behavioral Memory Impact', desc: 'How prior execution patterns improve future plan accuracy.' },
              ].map((m) => (
                <article key={m.label} className="glass-card rounded-xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#166534]/10 flex items-center justify-center mx-auto mb-4">
                    <m.icon className="w-6 h-6 text-[#166534]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{m.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Built For ═══ */}
        <section className="py-20 gradient-subtle">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={audienceRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for those who value consistency over inspiration
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: GraduationCap, title: 'Students', desc: 'Structured study plans with measurable weekly targets.' },
                { icon: Briefcase, title: 'Freelancers', desc: 'Client delivery milestones with deterministic pacing.' },
                { icon: Code, title: 'Builders & Indie Hackers', desc: 'Ship faster with locked execution roadmaps.' },
                { icon: Users, title: 'Professionals', desc: 'Deterministic execution for career and project goals.' },
              ].map((a) => (
                <article key={a.title} className="glass-card rounded-xl p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <a.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{a.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{a.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Why Serious Executors Choose KAMYAAB ═══ */}
        <section className="py-20 bg-background">
          <div className="container max-w-4xl mx-auto px-4">
            <article ref={whyRef} className="scroll-reveal glass-card rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Why serious executors choose KAMYAAB
              </h2>
              <ul className="space-y-4">
                {[
                  'Plan locking prevents scope creep — execute what you committed to.',
                  'Rolling 5-entry behavioral memory refines every future plan.',
                  '4-state timer with deterministic speed calculation for every task.',
                  'Strategic risk assessment surfaces assumptions before execution begins.',
                  'Subscription tiers for individuals and teams — standard is free.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {/* ═══ Comparison ═══ */}
        <section className="py-20 gradient-subtle">
          <div className="container max-w-5xl mx-auto px-4">
            <div ref={comparisonHeadingRef} className="scroll-reveal text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How KAMYAAB Compares</h2>
              <p className="text-muted-foreground text-lg">Not another to-do app. A structured execution system.</p>
            </div>
            <div ref={comparisonTableRef} className="scroll-reveal hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center py-4 px-4 font-bold tracking-[0.15em] uppercase text-primary">KAMYAAB</th>
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
            <div ref={comparisonMobileRef} className="scroll-reveal scroll-reveal-stagger grid grid-cols-1 gap-4 md:hidden">
              {comparisonData.map((row) => (
                <ComparisonCard key={row.feature} row={row} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Pricing Teaser ═══ */}
        <section className="py-12 bg-background">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <p className="text-muted-foreground text-sm">
              Standard is free · Pro and Business plans unlock unlimited strategic mode and team features.{' '}
              <Link to="/pricing" className="text-primary hover:underline font-medium">View pricing →</Link>
            </p>
          </div>
        </section>

        {/* ═══ Final CTA ═══ */}
        <section className="py-20 gradient-subtle">
          <div ref={ctaRef} className="scroll-reveal container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stop planning in your head. Start executing with structure.
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Your objectives deserve more than a checklist. Build a locked plan, track deterministic progress.
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
