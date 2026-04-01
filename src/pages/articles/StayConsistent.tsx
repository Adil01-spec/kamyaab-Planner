/**
 * Article: How to Stay Consistent With Your Goals
 * SEO content page — 1000+ words, real advice, soft CTA
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';

export default function StayConsistent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <article className="py-12 md:py-20">
          <div className="container max-w-3xl mx-auto px-4">
            {/* Breadcrumb */}
            <Link to="/learn" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Learn
            </Link>

            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                How to Stay Consistent With Your Goals
              </h1>
              <p className="text-muted-foreground text-lg">
                Why most goal systems fail — and what actually works when motivation disappears.
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground/60">
                <span>8 min read</span>
                <span>•</span>
                <span>Execution Strategy</span>
              </div>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed text-base">
                Consistency is the single most underrated skill in personal and professional growth. Not talent. Not intelligence. Not access to resources. The ability to show up, day after day, and do the work you said you would do — that is what separates people who achieve their goals from those who abandon them within weeks.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Yet most people struggle with it. Research from the University of Scranton suggests that only 8% of people who set New Year's resolutions actually achieve them. The other 92% fall off at some point — usually within the first month. Why? Because they're relying on motivation, which is inherently unreliable.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                The Motivation Trap
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                Motivation is a feeling. Like all feelings, it fluctuates. You wake up one morning ready to conquer the world; the next morning you can barely get out of bed. If your execution depends on how you feel, your execution will be inconsistent. Period.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                High performers don't rely on motivation. They rely on <strong className="text-foreground">systems</strong>. A system is a structured process that removes decision-making from the equation. Instead of asking "Do I feel like working on my project today?" you follow a predetermined sequence: open the plan, look at today's tasks, start the first one.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This is why professional athletes train at the same time every day regardless of mood. It's why surgeons follow checklists. It's why assembly lines produce consistent output. Systems beat motivation because systems don't depend on emotional state.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                The Three Pillars of Consistency
              </h2>

              <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                1. Structure Your Goals Into Weekly Milestones
              </h3>

              <p className="text-foreground/80 leading-relaxed text-base">
                A goal without milestones is just a wish. When someone says "I want to learn web development," that's not actionable. When someone says "This week I will complete three JavaScript exercises and build one small project," that's a milestone.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Break every goal into week-by-week chunks. Each week should have clear, specific deliverables — not vague intentions. "Work on my project" is vague. "Complete the database schema and write two API endpoints" is specific. Specificity creates accountability.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                When you can look at your plan and know exactly what "done" looks like for this week, you eliminate the mental overhead of deciding what to work on. That mental overhead is one of the biggest killers of consistency.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                2. Track Progress, Not Effort
              </h3>

              <p className="text-foreground/80 leading-relaxed text-base">
                Most people track the wrong things. They track hours spent, pages read, or "effort level." But effort without output is wasted energy. What matters is whether tasks moved from "not done" to "done."
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Adopt a binary tracking system: either a task is complete, or it isn't. No half-credit. This sounds harsh, but it creates clarity. When you review your week and see that 7 out of 10 tasks were completed, you have real data. You know your actual execution rate. You can adjust next week's plan accordingly.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This kind of honest self-assessment is uncomfortable but transformative. Over time, you develop a calibrated understanding of how much you can realistically accomplish in a week — and that calibration is the foundation of sustained consistency.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                3. Build Adaptive Plans, Not Rigid Ones
              </h3>

              <p className="text-foreground/80 leading-relaxed text-base">
                Here's the paradox: you need structure to be consistent, but too much rigidity causes failure. Life happens. Emergencies come up. Energy levels vary. If your plan doesn't account for reality, you'll abandon it the first time reality intrudes.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                The best plans are structured but adaptive. They have clear weekly milestones, but they also incorporate feedback from previous weeks. If you consistently complete only 6 out of 10 tasks, a smart plan will reduce the load to 7 next week — pushing you slightly beyond your comfort zone without setting you up for failure.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This is what behavioral memory in planning looks like. Your plan learns from your patterns and adjusts. Instead of you adapting to the plan, the plan adapts to you — while still pushing you forward.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                Common Mistakes That Kill Consistency
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Starting too big.</strong> The most dangerous moment is the beginning, when enthusiasm is highest. People create ambitious 12-week plans on day one, then collapse by week two. Start with what you know you can finish. Build confidence through small completions before attempting larger scope.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Not reviewing progress.</strong> If you never look back at what you've done, you lose the reinforcement loop that builds habits. Weekly reviews — even five-minute ones — create a mirror that shows you who you're becoming through your actions.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Confusing planning with doing.</strong> Some people spend hours organizing their tasks, color-coding categories, and optimizing workflows. Then they run out of energy for actual execution. Planning should take minutes, not hours. The goal is execution, not a beautiful plan.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                How to Get Started Today
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                Pick one goal. Just one. Write down what "done" looks like for this week — three to five specific tasks. Not ten. Not twenty. Three to five things you will complete by Sunday. Then start the first one immediately. Don't wait until Monday. Don't wait until you "feel ready." The readiness is a myth.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                At the end of the week, count how many you completed. No judgment — just data. Use that data to plan next week. Repeat. After four weeks, you'll have a pattern. After eight weeks, you'll have a habit. After twelve weeks, consistency will feel automatic.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Tools like <Link to="/" className="text-primary hover:underline font-medium">KAMYAAB</Link> automate this entire process — AI generates structured weekly plans, tracks completion with a deterministic timer, and uses behavioral memory to refine future plans based on your actual patterns. But the principle works with or without technology. The key is structure, tracking, and adaptation.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-14 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-foreground font-medium mb-2">Ready to build real consistency?</p>
              <p className="text-muted-foreground text-sm mb-4">
                KAMYAAB turns your goals into structured, trackable weekly plans — free.
              </p>
              <Button asChild>
                <Link to="/auth?mode=signup">
                  Start Free <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
