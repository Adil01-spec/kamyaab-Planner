import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

interface DynamicBackgroundProps {
  enabled: boolean;
}

// Get current time of day
const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

// Pattern configurations for each time of day
const patterns = {
  morning: {
    light: {
      primary: 'from-amber-100/40 via-orange-50/30 to-yellow-100/40',
      secondary: 'from-sky-100/30 via-blue-50/20 to-cyan-100/30',
      accent: 'bg-gradient-to-br from-yellow-200/20 to-orange-200/20',
      orbs: [
        { color: 'bg-amber-300/30', size: 'w-72 h-72', position: 'top-10 -right-20' },
        { color: 'bg-orange-200/25', size: 'w-96 h-96', position: '-top-20 left-10' },
        { color: 'bg-yellow-200/20', size: 'w-64 h-64', position: 'bottom-40 -left-10' },
        { color: 'bg-sky-200/20', size: 'w-80 h-80', position: 'top-1/3 right-1/4' },
      ],
    },
    dark: {
      primary: 'from-amber-900/20 via-orange-900/15 to-yellow-900/20',
      secondary: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
      accent: 'bg-gradient-to-br from-amber-800/15 to-orange-800/15',
      orbs: [
        { color: 'bg-amber-700/20', size: 'w-72 h-72', position: 'top-10 -right-20' },
        { color: 'bg-orange-800/15', size: 'w-96 h-96', position: '-top-20 left-10' },
        { color: 'bg-yellow-800/15', size: 'w-64 h-64', position: 'bottom-40 -left-10' },
        { color: 'bg-amber-900/10', size: 'w-80 h-80', position: 'top-1/3 right-1/4' },
      ],
    },
  },
  afternoon: {
    light: {
      primary: 'from-cyan-100/40 via-teal-50/30 to-emerald-100/40',
      secondary: 'from-blue-100/30 via-sky-50/20 to-indigo-100/30',
      accent: 'bg-gradient-to-br from-teal-200/20 to-cyan-200/20',
      orbs: [
        { color: 'bg-cyan-300/25', size: 'w-80 h-80', position: '-top-10 right-10' },
        { color: 'bg-teal-200/30', size: 'w-72 h-72', position: 'top-1/2 -left-20' },
        { color: 'bg-emerald-200/20', size: 'w-96 h-96', position: 'bottom-20 right-20' },
        { color: 'bg-blue-200/20', size: 'w-64 h-64', position: 'top-1/4 left-1/3' },
      ],
    },
    dark: {
      primary: 'from-cyan-900/20 via-teal-900/15 to-emerald-900/20',
      secondary: 'from-slate-800/40 via-slate-900/30 to-zinc-800/40',
      accent: 'bg-gradient-to-br from-teal-800/15 to-cyan-800/15',
      orbs: [
        { color: 'bg-cyan-800/15', size: 'w-80 h-80', position: '-top-10 right-10' },
        { color: 'bg-teal-900/20', size: 'w-72 h-72', position: 'top-1/2 -left-20' },
        { color: 'bg-emerald-900/15', size: 'w-96 h-96', position: 'bottom-20 right-20' },
        { color: 'bg-slate-800/15', size: 'w-64 h-64', position: 'top-1/4 left-1/3' },
      ],
    },
  },
  evening: {
    light: {
      primary: 'from-violet-100/35 via-purple-50/25 to-indigo-100/35',
      secondary: 'from-rose-100/25 via-pink-50/15 to-fuchsia-100/25',
      accent: 'bg-gradient-to-br from-indigo-200/15 to-violet-200/15',
      orbs: [
        { color: 'bg-violet-300/25', size: 'w-96 h-96', position: 'top-20 -right-30' },
        { color: 'bg-indigo-200/30', size: 'w-80 h-80', position: '-top-10 left-20' },
        { color: 'bg-purple-200/20', size: 'w-72 h-72', position: 'bottom-10 left-10' },
        { color: 'bg-rose-200/15', size: 'w-64 h-64', position: 'top-1/2 right-1/3' },
      ],
    },
    dark: {
      primary: 'from-violet-950/25 via-purple-950/20 to-indigo-950/25',
      secondary: 'from-slate-900/50 via-zinc-900/40 to-neutral-900/50',
      accent: 'bg-gradient-to-br from-indigo-900/15 to-violet-900/15',
      orbs: [
        { color: 'bg-violet-900/20', size: 'w-96 h-96', position: 'top-20 -right-30' },
        { color: 'bg-indigo-900/25', size: 'w-80 h-80', position: '-top-10 left-20' },
        { color: 'bg-purple-900/15', size: 'w-72 h-72', position: 'bottom-10 left-10' },
        { color: 'bg-slate-800/15', size: 'w-64 h-64', position: 'top-1/2 right-1/3' },
      ],
    },
  },
};

export function DynamicBackground({ enabled }: DynamicBackgroundProps) {
  const { theme, resolvedTheme } = useTheme();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [mounted, setMounted] = useState(false);

  // Check time periodically
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const currentPattern = useMemo(() => {
    return patterns[timeOfDay][isDark ? 'dark' : 'light'];
  }, [timeOfDay, isDark]);

  if (!enabled || !mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base gradient layers */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${currentPattern.primary}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className={`absolute inset-0 bg-gradient-to-tl ${currentPattern.secondary}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Animated orbs with slow floating motion */}
      {currentPattern.orbs.map((orb, index) => (
        <motion.div
          key={`orb-${timeOfDay}-${index}`}
          className={`absolute ${orb.size} ${orb.color} rounded-full blur-3xl ${orb.position}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, 15, -10, 5, 0],
            y: [0, -10, 15, -5, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: index * 0.15 },
            scale: { duration: 0.8, delay: index * 0.15 },
            x: {
              duration: 20 + index * 5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            y: {
              duration: 25 + index * 5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />
      ))}

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
