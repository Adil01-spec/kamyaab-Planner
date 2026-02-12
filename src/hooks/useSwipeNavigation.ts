import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type Route = '/today' | '/plan' | '/home';

const routes: Route[] = ['/today', '/plan', '/home'];

interface SwipeConfig {
  currentRoute: Route;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeNavigation({ currentRoute, threshold = 50, enabled = true }: SwipeConfig) {
  const navigate = useNavigate();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const currentIndex = routes.indexOf(currentRoute);

  const shouldIgnore = useRef(false);

  const isInsideScrollableContainer = (element: EventTarget | null): boolean => {
    let el = element as HTMLElement | null;
    while (el) {
      if (el.getAttribute?.('data-no-swipe-nav') !== null && el.getAttribute?.('data-no-swipe-nav') !== undefined) {
        if (el.hasAttribute('data-no-swipe-nav')) return true;
      }
      const overflowX = window.getComputedStyle(el).overflowX;
      if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    shouldIgnore.current = isInsideScrollableContainer(e.target);
    if (shouldIgnore.current) return;
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, [enabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || shouldIgnore.current) return;
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, [enabled]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || shouldIgnore.current || !touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;

    // Only navigate if horizontal swipe is greater than vertical (to avoid interfering with scroll)
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const isSignificantSwipe = Math.abs(distanceX) > threshold;

    if (isHorizontalSwipe && isSignificantSwipe) {
      const isSwipeLeft = distanceX > 0;

      if (isSwipeLeft && currentIndex < routes.length - 1) {
        // Swipe left → go to next route
        navigate(routes[currentIndex + 1]);
      } else if (!isSwipeLeft && currentIndex > 0) {
        // Swipe right → go to previous route
        navigate(routes[currentIndex - 1]);
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [enabled, currentIndex, navigate, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
