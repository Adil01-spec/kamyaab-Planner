import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissedEventCount, useDismissMissedEvents } from '@/hooks/useTaskCalendarEvents';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function MissedEventsBanner() {
  const navigate = useNavigate();
  const missedCount = useMissedEventCount();
  const dismissMissed = useDismissMissedEvents();
  const [dismissed, setDismissed] = useState(false);

  if (missedCount === 0 || dismissed) return null;

  const handleDismiss = () => {
    dismissMissed.mutate();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-3"
      >
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        <p className="text-sm text-foreground flex-1">
          You have <span className="font-semibold">{missedCount}</span> missed scheduled task{missedCount > 1 ? 's' : ''}.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => navigate('/calendar?filter=missed')}
        >
          Review
        </Button>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss missed events"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground/60" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
