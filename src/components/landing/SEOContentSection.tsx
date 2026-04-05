import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

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

export const SEOContentSection = () => (
  <section className="py-24 md:py-32 border-t border-border/30">
    <div className="container max-w-3xl mx-auto px-4">
      <RevealSection>
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            What is Kamyaab?
          </h2>

          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Kamyaab is an execution intelligence platform that helps you turn goals into structured
            weekly plans — and actually follow through on them. It uses AI to break down what you
            want to achieve into realistic, trackable milestones so you can stop planning and start
            finishing.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            Why do most people fail at execution?
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            It is rarely about motivation. Most people fail because they lack a system. They set
            ambitious goals, write them in a notebook or a to-do app, and then life gets in the way.
            Without a structured breakdown of what to do each week — and without real accountability
            — even the best intentions fade within days.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Research consistently shows that people who break goals into smaller, time-bound tasks
            are significantly more likely to complete them. Yet most productivity tools focus on
            listing tasks, not on building the discipline to execute them consistently.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            Why to-do lists and traditional planners don't work
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            To-do lists are great for groceries. They are terrible for goals that take weeks or
            months to accomplish. Here is why:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-base mb-6">
            <li>They don't show you the bigger picture or how tasks connect to outcomes.</li>
            <li>They don't adapt when you fall behind or move faster than expected.</li>
            <li>They treat every task equally, whether it takes five minutes or five hours.</li>
            <li>They provide no feedback on your consistency or execution patterns.</li>
          </ul>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Traditional planners suffer from the same problem. They give you a blank page and expect
            you to figure out the structure yourself. For most people, that blank page becomes
            another source of overwhelm rather than clarity.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            How Kamyaab is different
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            Kamyaab takes a fundamentally different approach. Instead of giving you a blank canvas,
            it asks you one question: <em>What do you want to achieve?</em>
          </p>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            From your answer, AI generates a structured execution plan — broken into weeks, with
            specific tasks, realistic timelines, and clear milestones. You don't have to figure out
            what to do first or how to pace yourself. The system handles that.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            Each day, Kamyaab shows you exactly what to focus on. You can track time spent on tasks,
            mark progress, and see how your actual execution compares to the plan. At the end of each
            cycle, AI-powered reviews highlight what worked, what slipped, and what to adjust — so
            your next plan is even better.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            Staying consistent is the hardest part — Kamyaab makes it easier
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            Consistency is not about willpower. It is about having a system that keeps you on track
            without requiring constant decision-making. Kamyaab does this through:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-base mb-6">
            <li><strong>Daily focus views</strong> that show only what matters today, reducing decision fatigue.</li>
            <li><strong>Progress rings and streaks</strong> that give you visual proof of consistency.</li>
            <li><strong>Execution analytics</strong> that reveal your patterns — when you are most productive, which tasks you tend to skip, and where you lose momentum.</li>
            <li><strong>Adaptive planning</strong> that adjusts to your real pace instead of punishing you for falling behind.</li>
          </ul>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            Who is Kamyaab for?
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            Kamyaab is built for anyone who has goals but struggles with follow-through. That
            includes students preparing for exams or managing thesis timelines, freelancers juggling
            client projects and personal growth, professionals working toward certifications or
            career milestones, and builders shipping side projects or MVPs.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            If you have ever written a plan and abandoned it within a week, Kamyaab is designed
            specifically for you. It is not about planning harder — it is about executing smarter.
          </p>

          <h3 className="text-xl font-semibold text-foreground mt-10 mb-4">
            Get started for free
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed mb-4">
            Kamyaab's standard tier is free forever — no credit card, no trial period, no catch. You
            can create unlimited plans, track your execution daily, and access AI-generated weekly
            breakdowns at no cost. For advanced features like strategic planning and execution
            analytics, explore our{' '}
            <Link to="/pricing" className="text-primary hover:underline font-medium">
              pricing plans
            </Link>.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            Ready to stop planning and start finishing?{' '}
            <Link to="/auth?mode=signup" className="text-primary hover:underline font-medium">
              Create your first plan now
            </Link>{' '}
            — it takes less than 60 seconds.
          </p>
        </article>
      </RevealSection>
    </div>
  </section>
);
