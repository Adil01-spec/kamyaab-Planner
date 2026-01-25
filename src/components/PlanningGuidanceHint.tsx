import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  generatePlanningHints,
  type PersonalExecutionProfile,
  type PlanningHint 
} from '@/lib/personalExecutionProfile';

interface PlanningGuidanceHintProps {
  profile: PersonalExecutionProfile | null;
  currentStep: string;
  formData: {
    projectDescription?: string;
    projectDeadline?: string;
    noDeadline?: boolean;
  };
  className?: string;
}

export function PlanningGuidanceHint({ 
  profile, 
  currentStep, 
  formData,
  className 
}: PlanningGuidanceHintProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<PlanningHint | null>(null);

  useEffect(() => {
    const generatedHint = generatePlanningHints(profile, currentStep, formData);
    
    // Only show if not dismissed
    if (generatedHint && !dismissed.has(generatedHint.id)) {
      setHint(generatedHint);
    } else {
      setHint(null);
    }
  }, [profile, currentStep, formData, dismissed]);

  const handleDismiss = () => {
    if (hint) {
      setDismissed(prev => new Set([...prev, hint.id]));
      setHint(null);
    }
  };

  if (!hint) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("overflow-hidden", className)}
      >
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80 flex-1">
            {hint.text}
          </p>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-primary/10 transition-colors shrink-0"
            aria-label="Dismiss hint"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
