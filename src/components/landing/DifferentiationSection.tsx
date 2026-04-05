import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Check } from 'lucide-react';

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

const others = [
  'To-do lists with no structure',
  'Static tasks you forget about',
  'Planning-focused, no follow-through',
  'No real execution tracking',
];

const kamyaab = [
  'Structured weekly execution plans',
  'System-based goal breakdown',
  'Execution-first approach',
  'Real progress tracking & insights',
];

export const DifferentiationSection = () => (
  <section className="py-24 md:py-32 border-t border-border/30">
    <div className="container max-w-4xl mx-auto px-4">
      <RevealSection className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          This is not another planner.
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Most tools help you list tasks. Kamyaab helps you finish them.
        </p>
      </RevealSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <RevealSection delay={0.1}>
          <div className="rounded-2xl border border-border/50 p-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-5">
              Other tools
            </p>
            <ul className="space-y-4">
              {others.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground text-sm leading-relaxed">
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-destructive/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </RevealSection>

        <RevealSection delay={0.2}>
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-5">
              Kamyaab
            </p>
            <ul className="space-y-4">
              {kamyaab.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground text-sm leading-relaxed">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </RevealSection>
      </div>
    </div>
  </section>
);
