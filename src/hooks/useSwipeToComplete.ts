// Hook for mobile swipe-to-complete gesture with haptic feedback

import { useState, useCallback, useRef } from 'react';
import { PanInfo } from 'framer-motion';
import { hapticSuccess, hapticLight, hapticSelection } from '@/lib/hapticFeedback';

interface UseSwipeToCompleteOptions {
  onComplete: () => void;
  onStart?: () => void;
  threshold?: number; // Distance in pixels to trigger completion
  direction?: 'left' | 'right' | 'both';
  disabled?: boolean;
}

interface UseSwipeToCompleteReturn {
  // Drag props to spread on motion element
  dragProps: {
    drag: 'x' | false;
    dragConstraints: { left: number; right: number };
    dragElastic: number;
    onDragStart: () => void;
    onDrag: (event: any, info: PanInfo) => void;
    onDragEnd: (event: any, info: PanInfo) => void;
  };
  // State
  isDragging: boolean;
  dragProgress: number; // 0 to 1, how close to threshold
  isTriggered: boolean;
  swipeDirection: 'left' | 'right' | null;
  // Style helpers
  getSwipeStyles: () => {
    x: number;
    opacity: number;
    scale: number;
  };
}

export function useSwipeToComplete({
  onComplete,
  onStart,
  threshold = 120,
  direction = 'right',
  disabled = false,
}: UseSwipeToCompleteOptions): UseSwipeToCompleteReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [currentX, setCurrentX] = useState(0);
  
  const hasPassedThresholdRef = useRef(false);
  const hasHaptedMidpointRef = useRef(false);

  const handleDragStart = useCallback(() => {
    if (disabled) return;
    setIsDragging(true);
    setIsTriggered(false);
    hasPassedThresholdRef.current = false;
    hasHaptedMidpointRef.current = false;
    hapticSelection(); // Light tap on drag start
  }, [disabled]);

  const handleDrag = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled) return;

      const offset = info.offset.x;
      setCurrentX(offset);

      // Determine swipe direction
      if (offset > 0) {
        setSwipeDirection('right');
      } else if (offset < 0) {
        setSwipeDirection('left');
      }

      // Check if direction is allowed
      const isAllowed =
        direction === 'both' ||
        (direction === 'right' && offset > 0) ||
        (direction === 'left' && offset < 0);

      if (!isAllowed) {
        setDragProgress(0);
        return;
      }

      // Calculate progress (0 to 1)
      const absOffset = Math.abs(offset);
      const progress = Math.min(absOffset / threshold, 1);
      setDragProgress(progress);

      // Haptic at midpoint (50%)
      if (progress >= 0.5 && !hasHaptedMidpointRef.current) {
        hasHaptedMidpointRef.current = true;
        hapticLight();
      }

      // Haptic when crossing threshold
      if (progress >= 1 && !hasPassedThresholdRef.current) {
        hasPassedThresholdRef.current = true;
        hapticSuccess();
      }
    },
    [disabled, direction, threshold]
  );

  const handleDragEnd = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled) return;

      const offset = info.offset.x;
      const absOffset = Math.abs(offset);

      // Check if threshold was met in allowed direction
      const isAllowed =
        direction === 'both' ||
        (direction === 'right' && offset > 0) ||
        (direction === 'left' && offset < 0);

      if (isAllowed && absOffset >= threshold) {
        setIsTriggered(true);
        hapticSuccess();
        
        // Small delay for visual feedback before triggering
        setTimeout(() => {
          if (onStart && swipeDirection === 'left') {
            onStart();
          } else {
            onComplete();
          }
        }, 150);
      } else {
        // Reset - didn't meet threshold
        hapticLight();
      }

      // Reset state
      setIsDragging(false);
      setDragProgress(0);
      setCurrentX(0);
      setSwipeDirection(null);
      hasPassedThresholdRef.current = false;
      hasHaptedMidpointRef.current = false;
    },
    [disabled, direction, threshold, onComplete, onStart, swipeDirection]
  );

  const getSwipeStyles = useCallback(() => {
    if (isTriggered) {
      return {
        x: swipeDirection === 'left' ? -200 : 200,
        opacity: 0,
        scale: 0.95,
      };
    }

    return {
      x: currentX,
      opacity: 1 - dragProgress * 0.3,
      scale: 1 - dragProgress * 0.02,
    };
  }, [isTriggered, swipeDirection, currentX, dragProgress]);

  // Calculate drag constraints based on direction
  const getDragConstraints = () => {
    switch (direction) {
      case 'left':
        return { left: -threshold * 1.5, right: 0 };
      case 'right':
        return { left: 0, right: threshold * 1.5 };
      case 'both':
        return { left: -threshold * 1.5, right: threshold * 1.5 };
      default:
        return { left: 0, right: 0 };
    }
  };

  const dragProps = {
    drag: (disabled ? false : 'x') as 'x' | false,
    dragConstraints: getDragConstraints(),
    dragElastic: 0.1,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  return {
    dragProps,
    isDragging,
    dragProgress,
    isTriggered,
    swipeDirection,
    getSwipeStyles,
  };
}
