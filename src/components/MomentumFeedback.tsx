import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon } from 'lucide-react';

interface MomentumFeedbackProps {
  completedCount: number;
  totalCount: number;
  show: boolean;
}

// Get contextual feedback message
const getFeedbackMessage = (completed: number, total: number): { text: string; icon: 'sparkle' | 'moon' } | null => {
  // First task completed
  if (completed === 1 && total > 1) {
    return { text: "Nice start. Momentum unlocked.", icon: 'sparkle' };
  }
  
  // All tasks completed
  if (completed === total && total > 0) {
    return { text: "Today is complete. Shut it down guilt-free.", icon: 'moon' };
  }
  
  // Middle task completed (only show for 3 tasks)
  if (completed === 2 && total === 3) {
    return { text: "One more to go. You've got this.", icon: 'sparkle' };
  }
  
  return null;
};

export function MomentumFeedback({ completedCount, totalCount, show }: MomentumFeedbackProps) {
  const feedback = getFeedbackMessage(completedCount, totalCount);
  
  if (!feedback || !show) return null;

  const IconComponent = feedback.icon === 'moon' ? Moon : Sparkles;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-6"
      >
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/5 border border-primary/10">
          <IconComponent className="w-4 h-4 text-primary" />
          <p className="text-sm text-foreground/80 font-medium">
            {feedback.text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
