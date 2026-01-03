import { useState, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { getDesktopSettings } from "@/hooks/useDesktopSettings";

interface CursorExplosionButtonProps extends ButtonProps {
  children: ReactNode;
  /** Force disable the cursor effect (for when settings context isn't available) */
  disableEffect?: boolean;
}

/**
 * Button with flying cursor explosion effect on hover
 * Cursors fly out in concentric circles and rotate around the button
 * Respects desktop performance settings
 */
export function CursorExplosionButton({ 
  children, 
  className,
  disableEffect = false,
  ...props 
}: CursorExplosionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if cursor effects are enabled
  const effectsEnabled = !disableEffect && getDesktopSettings().cursorEffects;

  // Generate cursor positions in concentric circles
  const cursors = useMemo(() => {
    const result = [];
    // Smaller radii for the button size
    const circles = [60, 85, 110];
    const cursorsPerCircle = [6, 8, 10];
    
    circles.forEach((radius, circleIndex) => {
      const count = cursorsPerCircle[circleIndex];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Calculate rotation to point outward from button center
        const rotationOutward = Math.atan2(y, x) * (180 / Math.PI);
        
        // Main cursor
        result.push({
          id: `cursor-${circleIndex}-${i}`,
          finalX: x,
          finalY: y,
          delay: circleIndex * 0.015 + i * 0.003,
          rotation: rotationOutward,
          isTrail: false,
          opacity: 1,
          scale: 1
        });

        // Trail cursor
        result.push({
          id: `cursor-${circleIndex}-${i}-trail`,
          finalX: x,
          finalY: y,
          delay: circleIndex * 0.015 + i * 0.003 + 0.01,
          rotation: rotationOutward,
          isTrail: true,
          opacity: 0.5,
          scale: 0.7
        });
      }
    });
    
    return result;
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Flying Cursors Effect - respects settings */}
      <AnimatePresence>
        {isHovered && effectsEnabled && (
          <motion.div
            className="absolute pointer-events-none z-50"
            style={{ 
              left: '50%', 
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              rotate: -360
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {cursors.map((cursor) => (
              <motion.div
                key={cursor.id}
                className="absolute pointer-events-none"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: cursor.finalX,
                  y: cursor.finalY,
                  opacity: cursor.isTrail ? cursor.opacity : [0.9, 0.6, 0.9],
                  scale: cursor.isTrail ? cursor.scale : [1, 1.15, 1]
                }}
                exit={{
                  opacity: 0,
                  scale: 0,
                  transition: { duration: 0.05 }
                }}
                transition={{
                  duration: 0.12,
                  delay: cursor.delay,
                  ease: "easeOut",
                  type: "spring",
                  damping: 20,
                  stiffness: 350,
                  opacity: {
                    duration: cursor.isTrail ? 0.12 : 2.5,
                    repeat: cursor.isTrail ? 0 : Infinity,
                    ease: "easeInOut"
                  },
                  scale: {
                    duration: cursor.isTrail ? 0.12 : 2.5,
                    repeat: cursor.isTrail ? 0 : Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <MousePointer 
                  className="w-3.5 h-3.5 drop-shadow-lg" 
                  style={{ 
                    color: 'hsl(var(--primary))',
                    filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))',
                    opacity: cursor.opacity,
                    transform: `scale(${cursor.scale}) rotate(${cursor.rotation}deg)`
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing glow ring on hover - respects settings */}
      <AnimatePresence>
        {isHovered && effectsEnabled && (
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [1, 1.08, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              boxShadow: '0 0 20px hsl(var(--primary) / 0.4)',
            }}
          />
        )}
      </AnimatePresence>

      {/* The actual button */}
      <Button 
        className={`relative z-10 ${className}`}
        {...props}
      >
        {children}
      </Button>
    </div>
  );
}
