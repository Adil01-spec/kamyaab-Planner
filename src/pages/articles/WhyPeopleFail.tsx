/**
 * Article: Why Most People Fail at Execution (And How to Fix It)
 * SEO content page — 1000+ words
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';

export default function WhyPeopleFail() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <article className="py-12 md:py-20">
          <div className="container max-w-3xl mx-auto px-4">
            <Link to="/learn" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Learn
            </Link>

            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                Why Most People Fail at Execution (And How to Fix It)
              </h1>
              <p className="text-muted-foreground text-lg">
                The three structural mistakes that doom plans before they start.
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground/60">
                <span>10 min read</span>
                <span>•</span>
                <span>Execution Psychology</span>
              </div>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-foreground/80 leading-relaxed text-base">
                Every January, millions of people set goals. By February, most have quietly abandoned them. By March, the goals are forgotten entirely. This isn't a character flaw. It's a structural problem. The way most people approach goal execution is fundamentally broken — and fixing it requires understanding why.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                After analyzing thousands of execution patterns, three consistent failure modes emerge. They're predictable, they're preventable, and they affect everyone from students to CEOs. Understanding them is the first step toward building a system that actually works.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                Failure Mode #1: The Undefined Finish Line
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                Most goals don't fail because people lack discipline. They fail because people don't know what "done" looks like. "Get in shape" is not a goal — it's a direction. "Complete a 5K in under 30 minutes by March 15th" is a goal. The difference is specificity.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Without a clear finish line, every day feels the same. You're "working on it" but never finishing anything. There's no sense of progress because there's no definition of progress. You can't measure distance traveled if you don't know where you're going.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                The fix is brutally simple: define the outcome in measurable terms before you start. What specific result? By what date? How will you know it's done? If you can't answer these questions, you don't have a goal — you have a hope. And hope is not a strategy.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This applies at every level. Your overall goal needs a finish line. Each month needs milestones. Each week needs deliverables. Each day needs tasks. When every level has a clear "done" definition, execution becomes a sequence of completions instead of an amorphous blob of effort.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                Failure Mode #2: The Planning-Execution Gap
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                Here's a scenario that plays out millions of times every day: someone spends the weekend creating an elaborate plan. Spreadsheets, timelines, color-coded categories. Monday morning arrives. They look at the plan and feel overwhelmed. They do something easier instead. The plan sits untouched until guilt forces a replanning session the following weekend.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This is the planning-execution gap. It happens when there's no bridge between "here's what I want to do" and "here's the very next physical action I need to take." A plan that says "Build the marketing website" is useless at 9 AM on a Tuesday. A plan that says "Write the homepage headline and three subheadings" is actionable.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                The gap widens with ambition. The bigger the goal, the more abstract the plan tends to be. And abstract plans create paralysis. You stare at "Launch the product" and your brain freezes because it can't parse that into a physical action.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">The fix:</strong> every plan must decompose into tasks that can be completed in a single sitting. No task should take more than two hours. If it does, break it down further. The question to ask is: "Could someone who knows nothing about this project sit down and complete this specific task?" If yes, it's actionable. If no, it needs further decomposition.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                Failure Mode #3: No Feedback Loop
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                The third and most insidious failure mode is operating without feedback. You execute for weeks without ever measuring whether your approach is working. Then, when you finally check, you realize you've been running in the wrong direction.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                Feedback loops exist in every successful system. Athletes review game tape. Companies analyze quarterly reports. Scientists run experiments and measure results. But individuals working on personal goals? Most just... keep going and hope for the best.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                A proper feedback loop for personal execution has four components:
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Measurement:</strong> What's your task completion rate this week? Not your perceived effort — your actual completion percentage. If you planned 12 tasks and finished 8, that's 67%. That's your real number.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Pattern recognition:</strong> Which types of tasks do you consistently complete? Which do you defer? Are there time-of-day patterns? Certain tasks may consistently get pushed to "tomorrow" — that's a signal, not a coincidence.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Calibration:</strong> Based on your actual completion data, adjust next week's plan. If you're completing 67% of tasks, your plan is 33% too ambitious. Reduce scope until completion rate hits 80%, then gradually increase.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">Memory:</strong> The best feedback loops remember your patterns across plans. If you consistently underestimate design tasks, future plans should auto-allocate more time for design. If you're fastest on Monday mornings, important tasks should be sequenced there.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                The Execution Architecture That Works
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                Once you understand these three failure modes, the solution architecture becomes clear:
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">1. Define outcomes with precision.</strong> Not "improve fitness" but "run 5K in 28 minutes by April 1st." Not "learn coding" but "deploy a full-stack web app with authentication by week 8."
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">2. Decompose into atomic tasks.</strong> Every milestone breaks into tasks completable in one sitting. No task is so large that you don't know where to start. No task is so vague that "done" is ambiguous.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <strong className="text-foreground">3. Build a weekly feedback loop.</strong> Measure completion rate. Identify patterns. Adjust scope. Remember what works. Repeat every week without fail.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                This architecture is simple on paper and transformative in practice. People who adopt it consistently report two things: they accomplish more, and they feel less overwhelmed. That's not contradictory — it's the natural result of working within a calibrated system instead of against an arbitrary one.
              </p>

              <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">
                Technology as an Execution Multiplier
              </h2>

              <p className="text-foreground/80 leading-relaxed text-base">
                You can implement this architecture with a notebook and a pen. But technology can automate the tedious parts — plan generation, task sequencing, time tracking, and pattern analysis — so you focus entirely on doing the work.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                <Link to="/" className="text-primary hover:underline font-medium">KAMYAAB</Link> was built around this exact architecture. You describe your objective, AI generates a structured multi-week plan with properly decomposed tasks, a 4-state timer tracks execution speed, and behavioral memory adjusts future plans based on your actual patterns. It's the execution architecture described above, automated.
              </p>

              <p className="text-foreground/80 leading-relaxed text-base">
                But the tool matters less than the principles. Whether you use KAMYAAB, a spreadsheet, or a physical planner — define your finish line, decompose into atomic tasks, and build a weekly feedback loop. Do these three things and you'll join the small minority of people who actually finish what they start.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-14 p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-foreground font-medium mb-2">Fix your execution system today.</p>
              <p className="text-muted-foreground text-sm mb-4">
                KAMYAAB builds structured plans with built-in feedback loops — free.
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
