import { useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle, Flame } from 'lucide-react';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TARGET_PERCENT = 87;

export const ConsistencyScoreRing = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset = visible
    ? CIRCUMFERENCE * (1 - TARGET_PERCENT / 100)
    : CIRCUMFERENCE;

  return (
    <section ref={ref} className="py-20 gradient-subtle">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Execution You Can Measure
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kaamyab tracks execution reliability — not just completion. Your Consistency Score reflects how predictably you execute.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="180" height="180" className="transform -rotate-90">
              <circle
                cx="90" cy="90" r={RADIUS}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              <circle
                cx="90" cy="90" r={RADIUS}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[1500ms] motion-safe:ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-foreground">
                {visible ? `${TARGET_PERCENT}%` : '0%'}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1">
                Consistency Score
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4 w-full max-w-sm">
            {[
              { icon: CheckCircle, label: 'Tasks completed on time', value: '92%' },
              { icon: Activity, label: 'Avg. execution accuracy', value: '89%' },
              { icon: Flame, label: 'Longest streak', value: '14 days' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
