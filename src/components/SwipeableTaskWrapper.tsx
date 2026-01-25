// Swipeable wrapper for task cards with visual feedback

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeToComplete } from '@/hooks/useSwipeToComplete';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableTaskWrapperProps {
  children: ReactNode;
  onComplete: () => void;
  onStart?: () => void;
  disabled?: boolean;
  isDone?: boolean;
  className?: string;
}

export function SwipeableTaskWrapper({
  children,
  onComplete,
  onStart,
  disabled = false,
  isDone = false,
  className,
}: SwipeableTaskWrapperProps) {
  const isMobile = useIsMobile();
  
  const {
    dragProps,
    isDragging,
    dragProgress,
    isTriggered,
    swipeDirection,
  } = useSwipeToComplete({
    onComplete,
    onStart,
    threshold: 100,
    direction: onStart ? 'both' : 'right',
    disabled: disabled || isDone || !isMobile,
  });

  // Don't add swipe on desktop
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background action indicators */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
        {/* Left indicator - Start task (when swiping left) */}
        {onStart && (
          <motion.div
            className="flex items-center gap-2 pl-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: swipeDirection === 'left' ? dragProgress : 0,
              x: swipeDirection === 'left' ? 0 : -20,
            }}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-primary/90 text-primary-foreground",
                dragProgress >= 1 && "scale-110"
              )}
              style={{
                transform: `scale(${0.8 + dragProgress * 0.4})`,
              }}
            >
              <Play className="w-5 h-5 fill-current" />
            </div>
            <span
              className={cn(
                "text-sm font-medium text-primary transition-opacity",
                dragProgress >= 0.5 ? "opacity-100" : "opacity-0"
              )}
            >
              Start
            </span>
          </motion.div>
        )}

        {/* Right indicator - Complete task (when swiping right) */}
        <motion.div
          className="flex items-center gap-2 pr-4 ml-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: swipeDirection === 'right' ? dragProgress : 0,
            x: swipeDirection === 'right' ? 0 : 20,
          }}
        >
          <span
            className={cn(
              "text-sm font-medium text-primary transition-opacity",
              dragProgress >= 0.5 ? "opacity-100" : "opacity-0"
            )}
          >
            Done
          </span>
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-primary/90 text-primary-foreground",
              dragProgress >= 1 && "scale-110"
            )}
            style={{
              transform: `scale(${0.8 + dragProgress * 0.4})`,
            }}
          >
            <Check className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Draggable card content */}
      <motion.div
        {...dragProps}
        animate={
          isTriggered
            ? {
                x: swipeDirection === 'left' ? -300 : 300,
                opacity: 0,
                scale: 0.9,
              }
            : { x: 0, opacity: 1, scale: 1 }
        }
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className={cn(
          "relative z-10",
          isDragging && "select-none"
        )}
      >
        {/* Progress indicator bar */}
        <AnimatePresence>
          {isDragging && dragProgress > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 3 }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "absolute top-0 left-0 right-0 z-20 rounded-t-2xl overflow-hidden",
                swipeDirection === 'right' ? "bg-primary/20" : "bg-primary/20"
              )}
            >
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${dragProgress * 100}%` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe hint on first render - subtle indicator */}
        {!isDone && !disabled && (
          <motion.div
            initial={{ opacity: 0.7, x: 0 }}
            animate={{ opacity: 0, x: 10 }}
            transition={{ duration: 1.5, delay: 0.5, repeat: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
              <span>→</span>
            </div>
          </motion.div>
        )}

        {children}
      </motion.div>
    </div>
  );
}
