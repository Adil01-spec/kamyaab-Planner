import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type BackgroundPattern = 'orbs' | 'geometric' | 'waves' | 'particles';

interface DynamicBackgroundProps {
  enabled: boolean;
  pattern?: BackgroundPattern;
}

// Get current time of day
const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

// Time-based color palettes
const colorPalettes = {
  morning: {
    light: {
      primary: ['#fbbf24', '#f97316', '#fcd34d'], // amber, orange, yellow
      secondary: ['#7dd3fc', '#93c5fd', '#a5f3fc'], // sky, blue, cyan
      gradient1: 'from-amber-100/40 via-orange-50/30 to-yellow-100/40',
      gradient2: 'from-sky-100/30 via-blue-50/20 to-cyan-100/30',
    },
    dark: {
      primary: ['#92400e', '#9a3412', '#854d0e'], // amber-800, orange-800, yellow-800
      secondary: ['#1e3a5f', '#1e3a8a', '#164e63'], // slate tones
      gradient1: 'from-amber-900/20 via-orange-900/15 to-yellow-900/20',
      gradient2: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
    },
  },
  afternoon: {
    light: {
      primary: ['#22d3ee', '#14b8a6', '#34d399'], // cyan, teal, emerald
      secondary: ['#60a5fa', '#38bdf8', '#818cf8'], // blue, sky, indigo
      gradient1: 'from-cyan-100/40 via-teal-50/30 to-emerald-100/40',
      gradient2: 'from-blue-100/30 via-sky-50/20 to-indigo-100/30',
    },
    dark: {
      primary: ['#155e75', '#115e59', '#065f46'], // cyan-800, teal-800, emerald-800
      secondary: ['#1e3a5f', '#0c4a6e', '#312e81'], // dark blues
      gradient1: 'from-cyan-900/20 via-teal-900/15 to-emerald-900/20',
      gradient2: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
    },
  },
  evening: {
    light: {
      primary: ['#a78bfa', '#c084fc', '#818cf8'], // violet, purple, indigo
      secondary: ['#fb7185', '#f472b6', '#e879f9'], // rose, pink, fuchsia
      gradient1: 'from-violet-100/35 via-purple-50/25 to-indigo-100/35',
      gradient2: 'from-rose-100/25 via-pink-50/15 to-fuchsia-100/25',
    },
    dark: {
      primary: ['#5b21b6', '#6b21a8', '#3730a3'], // violet-800, purple-800, indigo-800
      secondary: ['#1e1b4b', '#312e81', '#3f3f46'], // deep purples
      gradient1: 'from-violet-950/25 via-purple-950/20 to-indigo-950/25',
      gradient2: 'from-slate-900/50 via-zinc-900/40 to-neutral-900/50',
    },
  },
};

// ============= ORBS PATTERN =============
function OrbsPattern({ colors, isDark }: { colors: typeof colorPalettes.morning.light; isDark: boolean }) {
  const orbConfigs = [
    { size: 'w-72 h-72', position: 'top-10 -right-20', delay: 0 },
    { size: 'w-96 h-96', position: '-top-20 left-10', delay: 0.15 },
    { size: 'w-64 h-64', position: 'bottom-40 -left-10', delay: 0.3 },
    { size: 'w-80 h-80', position: 'top-1/3 right-1/4', delay: 0.45 },
  ];

  return (
    <>
      {orbConfigs.map((orb, index) => (
        <motion.div
          key={`orb-${index}`}
          className={`absolute ${orb.size} rounded-full blur-3xl ${orb.position}`}
          style={{ 
            backgroundColor: `${colors.primary[index % colors.primary.length]}${isDark ? '30' : '40'}` 
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, 15, -10, 5, 0],
            y: [0, -10, 15, -5, 0],
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            opacity: { duration: 1.5, delay: orb.delay },
            scale: { duration: 1.5, delay: orb.delay },
            x: { duration: 20 + index * 5, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 25 + index * 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </>
  );
}

// ============= GEOMETRIC PATTERN =============
function GeometricPattern({ colors, isDark }: { colors: typeof colorPalettes.morning.light; isDark: boolean }) {
  const shapes = [
    { type: 'circle', size: 200, x: '10%', y: '15%', rotation: 0 },
    { type: 'hexagon', size: 150, x: '80%', y: '20%', rotation: 30 },
    { type: 'triangle', size: 180, x: '70%', y: '70%', rotation: 15 },
    { type: 'circle', size: 120, x: '20%', y: '75%', rotation: 0 },
    { type: 'hexagon', size: 100, x: '50%', y: '50%', rotation: 45 },
    { type: 'diamond', size: 140, x: '35%', y: '25%', rotation: 0 },
  ];

  const getShapePath = (type: string, size: number) => {
    switch (type) {
      case 'hexagon':
        return `polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`;
      case 'triangle':
        return `polygon(50% 0%, 100% 100%, 0% 100%)`;
      case 'diamond':
        return `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`;
      default:
        return undefined;
    }
  };

  return (
    <>
      {shapes.map((shape, index) => (
        <motion.div
          key={`geo-${index}`}
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            transform: `translate(-50%, -50%)`,
          }}
          initial={{ opacity: 0, scale: 0, rotate: shape.rotation - 30 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: [shape.rotation, shape.rotation + 5, shape.rotation - 5, shape.rotation],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            opacity: { duration: 1.5, delay: index * 0.1 },
            scale: { duration: 1.5, delay: index * 0.1 },
            rotate: { duration: 30 + index * 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div
            className={`w-full h-full ${shape.type === 'circle' ? 'rounded-full' : ''}`}
            style={{
              backgroundColor: `${colors.primary[index % colors.primary.length]}${isDark ? '15' : '20'}`,
              clipPath: getShapePath(shape.type, shape.size),
              border: `1px solid ${colors.primary[index % colors.primary.length]}${isDark ? '20' : '30'}`,
              backdropFilter: 'blur(2px)',
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

// ============= WAVES PATTERN =============
function WavesPattern({ colors, isDark }: { colors: typeof colorPalettes.morning.light; isDark: boolean }) {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          className="absolute w-[200%] left-[-50%]"
          style={{
            bottom: `${index * 15}%`,
            height: '40%',
          }}
          initial={{ opacity: 0, x: '-25%' }}
          animate={{ 
            opacity: 1,
            x: ['-25%', '0%', '-25%'],
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, delay: index * 0.2 },
            x: { duration: 20 + index * 10, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <svg
            viewBox="0 0 1440 320"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <motion.path
              fill={`${colors.primary[index % colors.primary.length]}${isDark ? '15' : '20'}`}
              d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              animate={{
                d: [
                  "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,224C672,235,768,213,864,192C960,171,1056,149,1152,154.7C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                ],
              }}
              transition={{
                d: { duration: 8 + index * 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

// ============= PARTICLES PATTERN =============
function ParticlesPattern({ colors, isDark }: { colors: typeof colorPalettes.morning.light; isDark: boolean }) {
  const particleCount = 40;
  const particles = useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 8,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 5,
      colorIndex: i % colors.primary.length,
    })),
    [colors.primary.length]
  );

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: `${colors.primary[particle.colorIndex]}${isDark ? '40' : '50'}`,
            boxShadow: `0 0 ${particle.size * 2}px ${colors.primary[particle.colorIndex]}${isDark ? '30' : '40'}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
            y: [0, -30, 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            opacity: { duration: particle.duration, repeat: Infinity, delay: particle.delay },
            scale: { duration: particle.duration, repeat: Infinity, delay: particle.delay },
            y: { duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' },
            x: { duration: particle.duration * 1.5, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' },
          }}
        />
      ))}
    </>
  );
}

// ============= MAIN COMPONENT =============
export function DynamicBackground({ enabled, pattern = 'orbs' }: DynamicBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [mounted, setMounted] = useState(false);
  const prevTimeOfDay = useRef<TimeOfDay>(timeOfDay);

  // Check time periodically
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const newTime = getTimeOfDay();
      if (newTime !== prevTimeOfDay.current) {
        prevTimeOfDay.current = newTime;
        setTimeOfDay(newTime);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const isDark = resolvedTheme === 'dark';
  
  const colors = useMemo(() => {
    return colorPalettes[timeOfDay][isDark ? 'dark' : 'light'];
  }, [timeOfDay, isDark]);

  if (!enabled || !mounted) return null;

  const PatternComponent = {
    orbs: OrbsPattern,
    geometric: GeometricPattern,
    waves: WavesPattern,
    particles: ParticlesPattern,
  }[pattern];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base gradient layers with smooth time transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`gradient1-${timeOfDay}-${isDark}`}
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`gradient2-${timeOfDay}-${isDark}`}
          className={`absolute inset-0 bg-gradient-to-tl ${colors.gradient2}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.3, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Pattern elements with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`pattern-${pattern}-${timeOfDay}-${isDark}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <PatternComponent colors={colors} isDark={isDark} />
        </motion.div>
      </AnimatePresence>

      {/* Subtle noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft vignette for focus */}
      <div 
        className="absolute inset-0"
        style={{
          background: isDark 
            ? 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.3) 100%)',
        }}
      />
    </div>
  );
}

export default DynamicBackground;
