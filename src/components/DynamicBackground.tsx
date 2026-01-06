import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useParallaxMotion } from '@/hooks/useParallaxMotion';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type BackgroundPattern = 'orbs' | 'geometric' | 'waves' | 'particles' | 'seasonal';

interface DynamicBackgroundProps {
  enabled: boolean;
  pattern?: BackgroundPattern;
  parallaxEnabled?: boolean;
  deviceMotionEnabled?: boolean;
}

// Get current time of day
const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

// Get current season based on month
const getSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring'; // Mar-May
  if (month >= 5 && month <= 7) return 'summer'; // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn'; // Sep-Nov
  return 'winter'; // Dec-Feb
};

// Time-based color palettes
const colorPalettes = {
  morning: {
    light: {
      primary: ['#fbbf24', '#f97316', '#fcd34d'],
      secondary: ['#7dd3fc', '#93c5fd', '#a5f3fc'],
      gradient1: 'from-amber-100/40 via-orange-50/30 to-yellow-100/40',
      gradient2: 'from-sky-100/30 via-blue-50/20 to-cyan-100/30',
    },
    dark: {
      primary: ['#92400e', '#9a3412', '#854d0e'],
      secondary: ['#1e3a5f', '#1e3a8a', '#164e63'],
      gradient1: 'from-amber-900/20 via-orange-900/15 to-yellow-900/20',
      gradient2: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
    },
  },
  afternoon: {
    light: {
      primary: ['#22d3ee', '#14b8a6', '#34d399'],
      secondary: ['#60a5fa', '#38bdf8', '#818cf8'],
      gradient1: 'from-cyan-100/40 via-teal-50/30 to-emerald-100/40',
      gradient2: 'from-blue-100/30 via-sky-50/20 to-indigo-100/30',
    },
    dark: {
      primary: ['#155e75', '#115e59', '#065f46'],
      secondary: ['#1e3a5f', '#0c4a6e', '#312e81'],
      gradient1: 'from-cyan-900/20 via-teal-900/15 to-emerald-900/20',
      gradient2: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
    },
  },
  evening: {
    light: {
      primary: ['#a78bfa', '#c084fc', '#818cf8'],
      secondary: ['#fb7185', '#f472b6', '#e879f9'],
      gradient1: 'from-violet-100/35 via-purple-50/25 to-indigo-100/35',
      gradient2: 'from-rose-100/25 via-pink-50/15 to-fuchsia-100/25',
    },
    dark: {
      primary: ['#5b21b6', '#6b21a8', '#3730a3'],
      secondary: ['#1e1b4b', '#312e81', '#3f3f46'],
      gradient1: 'from-violet-950/25 via-purple-950/20 to-indigo-950/25',
      gradient2: 'from-slate-900/50 via-zinc-900/40 to-neutral-900/50',
    },
  },
};

// Seasonal color palettes
const seasonalPalettes = {
  spring: {
    light: {
      primary: ['#f9a8d4', '#86efac', '#fde047', '#a5f3fc'],
      secondary: ['#fecdd3', '#bbf7d0', '#fef08a'],
      gradient1: 'from-pink-100/40 via-green-50/30 to-yellow-100/40',
      gradient2: 'from-rose-100/30 via-emerald-50/20 to-cyan-100/30',
    },
    dark: {
      primary: ['#9d174d', '#166534', '#854d0e', '#155e75'],
      secondary: ['#831843', '#14532d', '#713f12'],
      gradient1: 'from-pink-900/20 via-green-900/15 to-yellow-900/20',
      gradient2: 'from-rose-950/30 via-emerald-950/20 to-cyan-950/30',
    },
  },
  summer: {
    light: {
      primary: ['#fbbf24', '#fb923c', '#22d3ee', '#4ade80'],
      secondary: ['#fde68a', '#fed7aa', '#a5f3fc'],
      gradient1: 'from-amber-100/45 via-orange-50/35 to-cyan-100/40',
      gradient2: 'from-yellow-100/30 via-sky-50/25 to-emerald-100/30',
    },
    dark: {
      primary: ['#92400e', '#9a3412', '#0e7490', '#166534'],
      secondary: ['#78350f', '#7c2d12', '#164e63'],
      gradient1: 'from-amber-900/25 via-orange-900/18 to-cyan-900/22',
      gradient2: 'from-yellow-950/30 via-sky-950/25 to-emerald-950/30',
    },
  },
  autumn: {
    light: {
      primary: ['#ea580c', '#dc2626', '#f59e0b', '#92400e'],
      secondary: ['#fdba74', '#fca5a5', '#fcd34d'],
      gradient1: 'from-orange-100/45 via-red-50/35 to-amber-100/40',
      gradient2: 'from-yellow-100/30 via-rose-50/25 to-orange-100/30',
    },
    dark: {
      primary: ['#9a3412', '#991b1b', '#92400e', '#78350f'],
      secondary: ['#7c2d12', '#7f1d1d', '#854d0e'],
      gradient1: 'from-orange-950/25 via-red-950/20 to-amber-950/25',
      gradient2: 'from-yellow-950/30 via-rose-950/25 to-orange-950/30',
    },
  },
  winter: {
    light: {
      primary: ['#e0f2fe', '#dbeafe', '#f0f9ff', '#cffafe'],
      secondary: ['#bae6fd', '#bfdbfe', '#e0f2fe'],
      gradient1: 'from-sky-100/50 via-blue-50/40 to-cyan-100/45',
      gradient2: 'from-slate-100/35 via-zinc-50/25 to-blue-100/35',
    },
    dark: {
      primary: ['#0c4a6e', '#1e3a8a', '#164e63', '#0e7490'],
      secondary: ['#0369a1', '#1d4ed8', '#0891b2'],
      gradient1: 'from-sky-950/30 via-blue-950/25 to-cyan-950/30',
      gradient2: 'from-slate-900/50 via-zinc-900/40 to-blue-950/45',
    },
  },
};

// ============= ORBS PATTERN =============
function OrbsPattern({ colors, isDark, parallaxStyle }: { colors: typeof colorPalettes.morning.light; isDark: boolean; parallaxStyle: React.CSSProperties }) {
  const orbConfigs = [
    { size: 'w-72 h-72', position: 'top-10 -right-20', delay: 0, depth: 0.5 },
    { size: 'w-96 h-96', position: '-top-20 left-10', delay: 0.15, depth: 0.8 },
    { size: 'w-64 h-64', position: 'bottom-40 -left-10', delay: 0.3, depth: 0.3 },
    { size: 'w-80 h-80', position: 'top-1/3 right-1/4', delay: 0.45, depth: 0.6 },
  ];

  return (
    <>
      {orbConfigs.map((orb, index) => (
        <motion.div
          key={`orb-${index}`}
          className={`absolute ${orb.size} rounded-full blur-3xl ${orb.position}`}
          style={{ 
            backgroundColor: `${colors.primary[index % colors.primary.length]}${isDark ? '30' : '40'}`,
            ...parallaxStyle,
            transform: `${parallaxStyle.transform || ''} scale(${1 + orb.depth * 0.1})`,
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
function GeometricPattern({ colors, isDark, parallaxStyle }: { colors: typeof colorPalettes.morning.light; isDark: boolean; parallaxStyle: React.CSSProperties }) {
  const shapes = [
    { type: 'circle', size: 200, x: '10%', y: '15%', rotation: 0, depth: 0.4 },
    { type: 'hexagon', size: 150, x: '80%', y: '20%', rotation: 30, depth: 0.7 },
    { type: 'triangle', size: 180, x: '70%', y: '70%', rotation: 15, depth: 0.5 },
    { type: 'circle', size: 120, x: '20%', y: '75%', rotation: 0, depth: 0.3 },
    { type: 'hexagon', size: 100, x: '50%', y: '50%', rotation: 45, depth: 0.6 },
    { type: 'diamond', size: 140, x: '35%', y: '25%', rotation: 0, depth: 0.8 },
  ];

  const getShapePath = (type: string) => {
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
            ...parallaxStyle,
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
              clipPath: getShapePath(shape.type),
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
function WavesPattern({ colors, isDark, parallaxStyle }: { colors: typeof colorPalettes.morning.light; isDark: boolean; parallaxStyle: React.CSSProperties }) {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          className="absolute w-[200%] left-[-50%]"
          style={{
            bottom: `${index * 15}%`,
            height: '40%',
            ...parallaxStyle,
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
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
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
              transition={{ d: { duration: 8 + index * 2, repeat: Infinity, ease: 'easeInOut' } }}
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

// ============= PARTICLES PATTERN =============
function ParticlesPattern({ colors, isDark, parallaxStyle }: { colors: typeof colorPalettes.morning.light; isDark: boolean; parallaxStyle: React.CSSProperties }) {
  const particles = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 8,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 5,
      colorIndex: i % colors.primary.length,
      depth: 0.3 + Math.random() * 0.7,
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
            ...parallaxStyle,
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

// ============= SEASONAL PATTERN =============
function SeasonalPattern({ season, colors, isDark, parallaxStyle }: { season: Season; colors: typeof seasonalPalettes.spring.light; isDark: boolean; parallaxStyle: React.CSSProperties }) {
  const elements = useMemo(() => {
    switch (season) {
      case 'spring':
        // Cherry blossoms / flowers
        return Array.from({ length: 25 }, (_, i) => ({
          id: i,
          type: 'flower',
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 15 + Math.random() * 25,
          rotation: Math.random() * 360,
          duration: 20 + Math.random() * 15,
          delay: Math.random() * 5,
          colorIndex: i % colors.primary.length,
          depth: 0.3 + Math.random() * 0.7,
        }));
      case 'summer':
        // Sun rays and sparkles
        return Array.from({ length: 30 }, (_, i) => ({
          id: i,
          type: 'sunray',
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 20 + Math.random() * 40,
          rotation: Math.random() * 360,
          duration: 15 + Math.random() * 10,
          delay: Math.random() * 3,
          colorIndex: i % colors.primary.length,
          depth: 0.4 + Math.random() * 0.6,
        }));
      case 'autumn':
        // Falling leaves
        return Array.from({ length: 20 }, (_, i) => ({
          id: i,
          type: 'leaf',
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          size: 20 + Math.random() * 30,
          rotation: Math.random() * 360,
          duration: 25 + Math.random() * 20,
          delay: Math.random() * 10,
          colorIndex: i % colors.primary.length,
          depth: 0.3 + Math.random() * 0.7,
        }));
      case 'winter':
        // Snowflakes
        return Array.from({ length: 35 }, (_, i) => ({
          id: i,
          type: 'snowflake',
          x: Math.random() * 100,
          y: -5 - Math.random() * 10,
          size: 8 + Math.random() * 15,
          rotation: Math.random() * 360,
          duration: 20 + Math.random() * 25,
          delay: Math.random() * 8,
          colorIndex: i % colors.primary.length,
          depth: 0.2 + Math.random() * 0.8,
        }));
    }
  }, [season, colors.primary.length]);

  const renderElement = (el: typeof elements[0]) => {
    const color = colors.primary[el.colorIndex];
    const opacity = isDark ? '40' : '60';

    switch (el.type) {
      case 'flower':
        return (
          <motion.div
            key={`flower-${el.id}`}
            className="absolute"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.size,
              height: el.size,
              ...parallaxStyle,
            }}
            initial={{ opacity: 0, scale: 0, rotate: el.rotation }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.8, 1, 0.8],
              rotate: [el.rotation, el.rotation + 15, el.rotation],
              y: [0, -5, 0],
            }}
            transition={{
              opacity: { duration: el.duration, repeat: Infinity, delay: el.delay },
              scale: { duration: el.duration, repeat: Infinity, delay: el.delay },
              rotate: { duration: el.duration * 2, repeat: Infinity, delay: el.delay },
              y: { duration: el.duration / 2, repeat: Infinity, delay: el.delay },
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={`${color}${opacity}`}>
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18C13.1 18 14 18.9 14 20C14 21.1 13.1 22 12 22M20 10C21.1 10 22 10.9 22 12C22 13.1 21.1 14 20 14C18.9 14 18 13.1 18 12C18 10.9 18.9 10 20 10M4 10C5.1 10 6 10.9 6 12C6 13.1 5.1 14 4 14C2.9 14 2 13.1 2 12C2 10.9 2.9 10 4 10M17.7 4.3C18.5 3.5 19.8 3.5 20.6 4.3C21.4 5.1 21.4 6.4 20.6 7.2C19.8 8 18.5 8 17.7 7.2C16.9 6.4 16.9 5.1 17.7 4.3M3.4 16.8C2.6 16 2.6 14.7 3.4 13.9C4.2 13.1 5.5 13.1 6.3 13.9C7.1 14.7 7.1 16 6.3 16.8C5.5 17.6 4.2 17.6 3.4 16.8M6.3 7.2C5.5 8 4.2 8 3.4 7.2C2.6 6.4 2.6 5.1 3.4 4.3C4.2 3.5 5.5 3.5 6.3 4.3C7.1 5.1 7.1 6.4 6.3 7.2M17.7 16.8C16.9 16 16.9 14.7 17.7 13.9C18.5 13.1 19.8 13.1 20.6 13.9C21.4 14.7 21.4 16 20.6 16.8C19.8 17.6 18.5 17.6 17.7 16.8M12 8C14.2 8 16 9.8 16 12C16 14.2 14.2 16 12 16C9.8 16 8 14.2 8 12C8 9.8 9.8 8 12 8Z" />
            </svg>
          </motion.div>
        );
      case 'sunray':
        return (
          <motion.div
            key={`sun-${el.id}`}
            className="absolute rounded-full"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: el.size,
              height: el.size,
              background: `radial-gradient(circle, ${color}${isDark ? '30' : '50'} 0%, transparent 70%)`,
              ...parallaxStyle,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              opacity: { duration: el.duration, repeat: Infinity, delay: el.delay },
              scale: { duration: el.duration, repeat: Infinity, delay: el.delay },
            }}
          />
        );
      case 'leaf':
        return (
          <motion.div
            key={`leaf-${el.id}`}
            className="absolute"
            style={{
              left: `${el.x}%`,
              width: el.size,
              height: el.size,
              ...parallaxStyle,
            }}
            initial={{ opacity: 0, y: el.y, x: 0, rotate: el.rotation }}
            animate={{
              opacity: [0, 0.8, 0.6, 0],
              y: [el.y, '110%'],
              x: [0, 50, -30, 40, 0],
              rotate: [el.rotation, el.rotation + 360 * 2],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: 'linear',
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={`${color}${opacity}`}>
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
          </motion.div>
        );
      case 'snowflake':
        return (
          <motion.div
            key={`snow-${el.id}`}
            className="absolute"
            style={{
              left: `${el.x}%`,
              width: el.size,
              height: el.size,
              ...parallaxStyle,
            }}
            initial={{ opacity: 0, y: el.y, rotate: el.rotation }}
            animate={{
              opacity: [0, 0.9, 0.7, 0],
              y: [el.y, '110%'],
              x: [0, 15, -15, 10, -10, 0],
              rotate: [el.rotation, el.rotation + 180],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: 'linear',
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={`${color}${opacity}`}>
              <path d="M11 1H13V4H11V1M16.5 4.5L18 3L19.5 4.5L18 6L16.5 4.5M19 11H22V13H19V11M16.5 19.5L18 18L19.5 19.5L18 21L16.5 19.5M11 20H13V23H11V20M4.5 19.5L6 18L7.5 19.5L6 21L4.5 19.5M2 11H5V13H2V11M4.5 4.5L6 6L4.5 7.5L3 6L4.5 4.5M12 6A6 6 0 1 1 6 12A6 6 0 0 1 12 6M12 8A4 4 0 1 0 16 12A4 4 0 0 0 12 8Z" />
            </svg>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return <>{elements.map(renderElement)}</>;
}

// ============= MAIN COMPONENT =============
export function DynamicBackground({ 
  enabled, 
  pattern = 'orbs',
  parallaxEnabled = false,
  deviceMotionEnabled = false,
}: DynamicBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [season, setSeason] = useState<Season>(getSeason);
  const [mounted, setMounted] = useState(false);
  const prevTimeOfDay = useRef<TimeOfDay>(timeOfDay);

  const { getTranslateStyle } = useParallaxMotion({
    enabled: enabled && parallaxEnabled,
    deviceMotionEnabled,
    sensitivity: 0.8,
    smoothing: 0.08,
  });

  // Check time periodically
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const newTime = getTimeOfDay();
      if (newTime !== prevTimeOfDay.current) {
        prevTimeOfDay.current = newTime;
        setTimeOfDay(newTime);
      }
      setSeason(getSeason());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = resolvedTheme === 'dark';
  
  const colors = useMemo(() => {
    if (pattern === 'seasonal') {
      return seasonalPalettes[season][isDark ? 'dark' : 'light'];
    }
    return colorPalettes[timeOfDay][isDark ? 'dark' : 'light'];
  }, [timeOfDay, season, isDark, pattern]);

  const seasonalColors = useMemo(() => {
    return seasonalPalettes[season][isDark ? 'dark' : 'light'];
  }, [season, isDark]);

  const parallaxStyle = parallaxEnabled ? getTranslateStyle(1) : {};

  if (!enabled || !mounted) return null;

  const renderPattern = () => {
    switch (pattern) {
      case 'orbs':
        return <OrbsPattern colors={colors} isDark={isDark} parallaxStyle={parallaxStyle} />;
      case 'geometric':
        return <GeometricPattern colors={colors} isDark={isDark} parallaxStyle={parallaxStyle} />;
      case 'waves':
        return <WavesPattern colors={colors} isDark={isDark} parallaxStyle={parallaxStyle} />;
      case 'particles':
        return <ParticlesPattern colors={colors} isDark={isDark} parallaxStyle={parallaxStyle} />;
      case 'seasonal':
        return <SeasonalPattern season={season} colors={seasonalColors} isDark={isDark} parallaxStyle={parallaxStyle} />;
      default:
        return <OrbsPattern colors={colors} isDark={isDark} parallaxStyle={parallaxStyle} />;
    }
  };

  const gradientColors = pattern === 'seasonal' ? seasonalColors : colors;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base gradient layers with smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`gradient1-${pattern === 'seasonal' ? season : timeOfDay}-${isDark}`}
          className={`absolute inset-0 bg-gradient-to-br ${gradientColors.gradient1}`}
          style={parallaxStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`gradient2-${pattern === 'seasonal' ? season : timeOfDay}-${isDark}`}
          className={`absolute inset-0 bg-gradient-to-tl ${gradientColors.gradient2}`}
          style={parallaxStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.3, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Pattern elements */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`pattern-${pattern}-${pattern === 'seasonal' ? season : timeOfDay}-${isDark}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {renderPattern()}
        </motion.div>
      </AnimatePresence>

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft vignette */}
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
