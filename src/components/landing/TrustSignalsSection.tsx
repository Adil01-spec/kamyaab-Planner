import { useRef } from 'react';
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

const testimonials = [
  {
    quote: 'Helped me actually stick to a plan for the first time. I went from saying I will start Monday to finishing a 6-week project on time.',
    name: 'Early user',
  },
  {
    quote: 'Finally something that focuses on execution, not just planning. The weekly breakdown changed how I approach goals.',
    name: 'Beta tester',
  },
  {
    quote: 'I used to overthink everything and never start. Kamyaab gave me a clear structure and I just… followed it.',
    name: 'Community member',
  },
];

export const TrustSignalsSection = () => (
  <section className="py-20 md:py-28 border-t border-border/30">
    <div className="container max-w-4xl mx-auto px-4">
      <RevealSection className="text-center mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
          From real users
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          People are finishing what they start.
        </h2>
      </RevealSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <RevealSection key={i} delay={i * 0.1}>
            <div className="rounded-2xl border border-border/50 p-6 flex flex-col justify-between h-full">
              <p className="text-sm text-foreground/90 leading-relaxed italic mb-4">
                "{t.quote}"
              </p>
              <p className="text-xs text-muted-foreground">— {t.name}</p>
            </div>
          </RevealSection>
        ))}
      </div>
    </div>
  </section>
);
