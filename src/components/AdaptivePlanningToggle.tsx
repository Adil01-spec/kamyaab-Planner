import { motion } from 'framer-motion';
import { Zap, Target, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTonedCopy, getToneProfile, type ToneProfile, type Profession } from '@/lib/adaptiveOnboarding';

interface AdaptivePlanningToggleProps {
  value: 'standard' | 'strategic';
  onChange: (value: 'standard' | 'strategic') => void;
  profession?: Profession;
  /** Whether to show intent-based labels (for 'Other' users) */
  showIntentLabels?: boolean;
}

/**
 * Adaptive Planning Mode Toggle
 * 
 * Adjusts tone and labels based on:
 * - User's profession (professional tone for Executive/Business Owner)
 * - Whether user selected "Other" (uses intent-based language instead of internal terminology)
 */
export function AdaptivePlanningToggle({ 
  value, 
  onChange, 
  profession,
  showIntentLabels = false,
}: AdaptivePlanningToggleProps) {
  const tone: ToneProfile = profession ? getToneProfile(profession) : 'casual';

  // Labels adapt based on context
  const questionText = getTonedCopy('planningModeQuestion', tone);
  const hintText = getTonedCopy('strategicModeHint', tone);

  // For "Other" users or intent-based display, use simpler language
  const standardTitle = showIntentLabels 
    ? 'Execution-focused' 
    : getTonedCopy('standardPlanningTitle', tone);
  
  const standardDescription = showIntentLabels
    ? 'Focus on actionable tasks and clear deliverables'
    : getTonedCopy('standardPlanningDescription', tone);

  const strategicTitle = showIntentLabels 
    ? 'Context-aware' 
    : getTonedCopy('strategicPlanningTitle', tone);
  
  const strategicDescription = showIntentLabels
    ? 'Include context, dependencies, and broader considerations'
    : getTonedCopy('strategicPlanningDescription', tone);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{questionText}</h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
          {hintText}
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
              <h3 className="font-semibold text-foreground">{standardTitle}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                Default
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {standardDescription}
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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{strategicTitle}</h3>
              {!showIntentLabels && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 font-medium bg-primary/10 text-primary border-primary/20"
                >
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {strategicDescription}
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

export default AdaptivePlanningToggle;
