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

// Two-tone palettes for each time of day - full, vibrant colors
const palettes: Record<TimeOfDay, AccentPalette> = {
  morning: {
    // Refreshing: Warm peach + cool sky blue
    light: {
      accent: '168 55% 42%',
      accentMuted: '168 40% 72%',
      accentFill: '168 50% 48%',
      bgGradient1: '28 75% 88%',   // Warm peach
      bgGradient2: '200 65% 85%',  // Sky blue
    },
    dark: {
      accent: '168 45% 52%',
      accentMuted: '168 30% 28%',
      accentFill: '168 38% 42%',
      bgGradient1: '28 45% 18%',   // Deep amber
      bgGradient2: '200 40% 14%',  // Deep blue
    },
  },
  afternoon: {
    // Energetic: Coral + fresh mint
    light: {
      accent: '175 50% 40%',
      accentMuted: '175 38% 70%',
      accentFill: '175 45% 46%',
      bgGradient1: '12 70% 86%',   // Coral
      bgGradient2: '155 55% 84%',  // Mint
    },
    dark: {
      accent: '175 42% 50%',
      accentMuted: '175 28% 26%',
      accentFill: '175 35% 40%',
      bgGradient1: '12 40% 16%',   // Deep coral
      bgGradient2: '155 35% 12%',  // Deep mint
    },
  },
  evening: {
    // Warm: Golden amber + soft lavender
    light: {
      accent: '160 48% 38%',
      accentMuted: '160 35% 68%',
      accentFill: '160 42% 44%',
      bgGradient1: '38 70% 82%',   // Golden amber
      bgGradient2: '270 50% 88%',  // Soft lavender
    },
    dark: {
      accent: '160 38% 48%',
      accentMuted: '160 25% 24%',
      accentFill: '160 32% 38%',
      bgGradient1: '38 45% 16%',   // Deep amber
      bgGradient2: '270 35% 14%',  // Deep purple
    },
  },
  night: {
    // Calm: Deep indigo + ocean teal
    light: {
      accent: '155 42% 36%',
      accentMuted: '155 30% 66%',
      accentFill: '155 36% 42%',
      bgGradient1: '235 55% 88%',  // Soft indigo
      bgGradient2: '185 50% 84%',  // Ocean teal
    },
    dark: {
      accent: '155 32% 46%',
      accentMuted: '155 22% 22%',
      accentFill: '155 28% 36%',
      bgGradient1: '235 40% 14%',  // Deep indigo
      bgGradient2: '185 35% 12%',  // Deep teal
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
