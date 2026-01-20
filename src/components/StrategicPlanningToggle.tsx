import { motion } from 'framer-motion';
import { Zap, Target, CheckCircle2 } from 'lucide-react';

interface StrategicPlanningToggleProps {
  value: 'standard' | 'strategic';
  onChange: (value: 'standard' | 'strategic') => void;
}

export function StrategicPlanningToggle({ value, onChange }: StrategicPlanningToggleProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Do you want to plan at a strategic level?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enable this if you're planning long-term initiatives, business strategy, or complex projects. You can skip this.
        </p>
      </div>

      <div className="grid gap-3">
        <motion.button
          onClick={() => onChange('standard')}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            value === 'standard'
              ? 'border-primary bg-primary/5 shadow-soft'
              : 'border-border/50 hover:border-primary/30'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            value === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Standard planning</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                Default
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quick setup, focus on tasks and execution
            </p>
          </div>
          {value === 'standard' && (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          )}
        </motion.button>

        <motion.button
          onClick={() => onChange('strategic')}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            value === 'strategic'
              ? 'border-primary bg-primary/5 shadow-soft'
              : 'border-border/50 hover:border-primary/30'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            value === 'strategic' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Strategic planning</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Advanced context for complex, long-term projects
            </p>
          </div>
          {value === 'strategic' && (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
