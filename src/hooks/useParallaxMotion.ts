import { useState, useEffect, useCallback, useRef } from 'react';

interface ParallaxState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  rotateX: number; // degrees
  rotateY: number; // degrees
}

interface UseParallaxMotionOptions {
  enabled: boolean;
  deviceMotionEnabled?: boolean;
  sensitivity?: number; // 0.1 to 2
  smoothing?: number; // 0 to 1
}

const DEFAULT_STATE: ParallaxState = { x: 0, y: 0, rotateX: 0, rotateY: 0 };

export function useParallaxMotion({
  enabled,
  deviceMotionEnabled = false,
  sensitivity = 1,
  smoothing = 0.1,
}: UseParallaxMotionOptions) {
  const [parallax, setParallax] = useState<ParallaxState>(DEFAULT_STATE);
  const targetRef = useRef<ParallaxState>(DEFAULT_STATE);
  const animationFrameRef = useRef<number>();
  const permissionGranted = useRef(false);

  // Smooth interpolation
  const lerp = useCallback((start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  }, []);

  // Animation loop for smooth updates
  useEffect(() => {
    if (!enabled) {
      setParallax(DEFAULT_STATE);
      return;
    }

    const animate = () => {
      setParallax(prev => ({
        x: lerp(prev.x, targetRef.current.x, smoothing),
        y: lerp(prev.y, targetRef.current.y, smoothing),
        rotateX: lerp(prev.rotateX, targetRef.current.rotateX, smoothing),
        rotateY: lerp(prev.rotateY, targetRef.current.rotateY, smoothing),
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, smoothing, lerp]);

  // Mouse movement handler (desktop)
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2 * sensitivity;
      const y = (e.clientY / window.innerHeight - 0.5) * 2 * sensitivity;
      
      targetRef.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
        rotateX: -y * 15 * sensitivity,
        rotateY: x * 15 * sensitivity,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, sensitivity]);

  // Device orientation handler (mobile)
  useEffect(() => {
    if (!enabled || !deviceMotionEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0; // -180 to 180 (front/back tilt)
      const gamma = e.gamma ?? 0; // -90 to 90 (left/right tilt)
      
      // Normalize to -1 to 1 range with sensitivity
      const x = Math.max(-1, Math.min(1, (gamma / 45) * sensitivity));
      const y = Math.max(-1, Math.min(1, ((beta - 45) / 45) * sensitivity)); // Offset for natural phone holding angle
      
      targetRef.current = {
        x,
        y,
        rotateX: -y * 10 * sensitivity,
        rotateY: x * 10 * sensitivity,
      };
    };

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            permissionGranted.current = true;
            window.addEventListener('deviceorientation', handleOrientation, { passive: true });
          }
        } catch (error) {
          console.debug('Device orientation permission denied:', error);
        }
      } else {
        // Non-iOS or older iOS
        permissionGranted.current = true;
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, deviceMotionEnabled, sensitivity]);

  // Request device motion permission (for iOS)
  const requestDeviceMotionPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Non-iOS devices don't need permission
  }, []);

  // Get CSS transform styles
  const getParallaxStyle = useCallback((depth: number = 1) => {
    if (!enabled) return {};
    
    return {
      transform: `
        translateX(${parallax.x * 20 * depth}px) 
        translateY(${parallax.y * 20 * depth}px)
        rotateX(${parallax.rotateX * depth}deg)
        rotateY(${parallax.rotateY * depth}deg)
      `,
      transition: 'transform 0.1s ease-out',
    };
  }, [enabled, parallax]);

  // Get translate-only style (for backgrounds)
  const getTranslateStyle = useCallback((depth: number = 1) => {
    if (!enabled) return {};
    
    return {
      transform: `translateX(${parallax.x * 30 * depth}px) translateY(${parallax.y * 30 * depth}px)`,
    };
  }, [enabled, parallax]);

  return {
    parallax,
    getParallaxStyle,
    getTranslateStyle,
    requestDeviceMotionPermission,
    isPermissionGranted: permissionGranted.current,
  };
}

export default useParallaxMotion;
