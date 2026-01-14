// Save Status Indicator - Shows sync/saved status

import { cn } from '@/lib/utils';
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
  showLabel?: boolean;
}

export function SaveStatusIndicator({
  status,
  className,
  showLabel = true,
}: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          label: 'Saving...',
          color: 'text-primary',
          animate: true,
        };
      case 'saved':
        return {
          icon: Check,
          label: 'Saved',
          color: 'text-green-500',
          animate: false,
        };
      case 'error':
        return {
          icon: CloudOff,
          label: 'Not saved',
          color: 'text-destructive',
          animate: false,
        };
      default:
        return {
          icon: Cloud,
          label: '',
          color: 'text-muted-foreground/50',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Don't show anything for idle state
  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          config.color,
          className
        )}
      >
        <Icon
          className={cn(
            "w-3.5 h-3.5",
            config.animate && "animate-spin"
          )}
        />
        {showLabel && config.label && (
          <span className="font-medium">{config.label}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage save status with auto-reset
import { useState, useCallback, useRef } from 'react';

export function useSaveStatus(resetDelay = 2000) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setSaving = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus('saving');
  }, []);

  const setSaved = useCallback(() => {
    setStatus('saved');
    timeoutRef.current = setTimeout(() => {
      setStatus('idle');
    }, resetDelay);
  }, [resetDelay]);

  const setError = useCallback(() => {
    setStatus('error');
    // Error state persists until next save attempt
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus('idle');
  }, []);

  return {
    status,
    setSaving,
    setSaved,
    setError,
    reset,
  };
}
