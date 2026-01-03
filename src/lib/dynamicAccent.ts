/**
 * Dynamic Accent & Background Color System
 * Changes based on time of day with two-tone ambient backgrounds
 */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface AccentPalette {
  light: {
    accent: string;
    accentMuted: string;
    accentFill: string;
    bgGradient1: string;  // Primary ambient color
    bgGradient2: string;  // Secondary ambient color
  };
  dark: {
    accent: string;
    accentMuted: string;
    accentFill: string;
    bgGradient1: string;
    bgGradient2: string;
  };
}

// Two-tone palettes for each time of day - very subtle, understated colors
const palettes: Record<TimeOfDay, AccentPalette> = {
  morning: {
    // Refreshing: Very subtle peach + sky hints
    light: {
      accent: '168 45% 45%',
      accentMuted: '168 35% 75%',
      accentFill: '168 40% 50%',
      bgGradient1: '32 50% 95%',   // Very subtle warm
      bgGradient2: '195 40% 94%',  // Barely-there blue
    },
    dark: {
      accent: '168 35% 55%',
      accentMuted: '168 25% 25%',
      accentFill: '168 30% 45%',
      bgGradient1: '32 25% 11%',   // Deep subtle amber
      bgGradient2: '195 20% 10%',  // Muted night
    },
  },
  afternoon: {
    // Energetic but subtle: Hint of coral + mint
    light: {
      accent: '175 40% 42%',
      accentMuted: '175 30% 72%',
      accentFill: '175 35% 48%',
      bgGradient1: '15 45% 95%',   // Whisper of coral
      bgGradient2: '155 35% 94%',  // Touch of mint
    },
    dark: {
      accent: '175 32% 52%',
      accentMuted: '175 22% 24%',
      accentFill: '175 28% 42%',
      bgGradient1: '15 20% 10%',   // Very subtle coral
      bgGradient2: '155 18% 9%',   // Dark mint hint
    },
  },
  evening: {
    // Warm but understated: Golden + lavender whispers
    light: {
      accent: '160 38% 40%',
      accentMuted: '160 28% 70%',
      accentFill: '160 33% 46%',
      bgGradient1: '38 45% 94%',   // Subtle golden
      bgGradient2: '275 30% 95%',  // Whisper lavender
    },
    dark: {
      accent: '160 30% 50%',
      accentMuted: '160 20% 22%',
      accentFill: '160 25% 40%',
      bgGradient1: '38 25% 10%',   // Deep subtle amber
      bgGradient2: '275 18% 9%',   // Muted purple hint
    },
  },
  night: {
    // Calm: Very subtle indigo + teal
    light: {
      accent: '155 32% 38%',
      accentMuted: '155 22% 68%',
      accentFill: '155 28% 44%',
      bgGradient1: '235 35% 95%',  // Hint of indigo
      bgGradient2: '185 30% 94%',  // Whisper teal
    },
    dark: {
      accent: '155 25% 48%',
      accentMuted: '155 18% 20%',
      accentFill: '155 22% 38%',
      bgGradient1: '235 25% 9%',   // Very deep indigo
      bgGradient2: '185 20% 8%',   // Dark teal hint
    },
  },
};

const SESSION_KEY = 'kaamyab_accent_session';

interface SessionData {
  timeOfDay: TimeOfDay;
  date: string;
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get cached time of day or calculate new one
 * Only recalculates on new day or fresh session
 */
function getCachedTimeOfDay(): TimeOfDay {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const data: SessionData = JSON.parse(stored);
      if (data.date === getTodayString()) {
        return data.timeOfDay;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  const timeOfDay = getTimeOfDay();
  const sessionData: SessionData = {
    timeOfDay,
    date: getTodayString(),
  };
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch {
    // Ignore storage errors
  }
  
  return timeOfDay;
}

/**
 * Apply dynamic accent and background CSS variables
 */
export function applyDynamicAccent(isDark: boolean): void {
  const timeOfDay = getCachedTimeOfDay();
  const palette = palettes[timeOfDay];
  const colors = isDark ? palette.dark : palette.light;
  
  const root = document.documentElement;
  
  // Accent colors
  root.style.setProperty('--dynamic-accent', colors.accent);
  root.style.setProperty('--dynamic-accent-muted', colors.accentMuted);
  root.style.setProperty('--dynamic-accent-fill', colors.accentFill);
  
  // Two-tone background gradients
  root.style.setProperty('--dynamic-bg-1', colors.bgGradient1);
  root.style.setProperty('--dynamic-bg-2', colors.bgGradient2);
}

/**
 * Get current time of day for display purposes
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  return getCachedTimeOfDay();
}

/**
 * Force recalculate accent (call on theme toggle)
 */
export function refreshAccent(isDark: boolean): void {
  applyDynamicAccent(isDark);
}

/**
 * Get background position based on scroll or interaction
 */
export function getBackgroundPosition(scrollY: number, maxScroll: number): { x1: number; y1: number; x2: number; y2: number } {
  const progress = Math.min(scrollY / Math.max(maxScroll, 1), 1);
  
  // Gradient 1: Moves from top-left to center-left
  const x1 = 10 + progress * 15;
  const y1 = 10 + progress * 30;
  
  // Gradient 2: Moves from bottom-right to center-right
  const x2 = 90 - progress * 15;
  const y2 = 90 - progress * 30;
  
  return { x1, y1, x2, y2 };
}
