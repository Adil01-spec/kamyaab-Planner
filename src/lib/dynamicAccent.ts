/**
 * Dynamic Accent Color System
 * Changes based on time of day, cached per session
 */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface AccentPalette {
  light: {
    accent: string;      // HSL values
    accentMuted: string; // Softer version for glows
    accentFill: string;  // For progress bars
  };
  dark: {
    accent: string;
    accentMuted: string;
    accentFill: string;
  };
}

// Carefully curated palettes - desaturated, eye-safe
const palettes: Record<TimeOfDay, AccentPalette> = {
  morning: {
    // Soft mint / sky teal
    light: {
      accent: '168 45% 45%',
      accentMuted: '168 35% 75%',
      accentFill: '168 40% 50%',
    },
    dark: {
      accent: '168 35% 55%',
      accentMuted: '168 25% 25%',
      accentFill: '168 30% 45%',
    },
  },
  afternoon: {
    // Calm blue-green
    light: {
      accent: '175 40% 42%',
      accentMuted: '175 30% 72%',
      accentFill: '175 35% 48%',
    },
    dark: {
      accent: '175 32% 52%',
      accentMuted: '175 22% 24%',
      accentFill: '175 28% 42%',
    },
  },
  evening: {
    // Muted indigo / emerald blend
    light: {
      accent: '160 38% 40%',
      accentMuted: '160 28% 70%',
      accentFill: '160 33% 46%',
    },
    dark: {
      accent: '160 30% 50%',
      accentMuted: '160 20% 22%',
      accentFill: '160 25% 40%',
    },
  },
  night: {
    // Deep jade / desaturated teal
    light: {
      accent: '155 32% 38%',
      accentMuted: '155 22% 68%',
      accentFill: '155 28% 44%',
    },
    dark: {
      accent: '155 25% 48%',
      accentMuted: '155 18% 20%',
      accentFill: '155 22% 38%',
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
      // Only use cache if same day
      if (data.date === getTodayString()) {
        return data.timeOfDay;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  // Calculate fresh
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
 * Apply dynamic accent CSS variables to document
 */
export function applyDynamicAccent(isDark: boolean): void {
  const timeOfDay = getCachedTimeOfDay();
  const palette = palettes[timeOfDay];
  const colors = isDark ? palette.dark : palette.light;
  
  const root = document.documentElement;
  
  root.style.setProperty('--dynamic-accent', colors.accent);
  root.style.setProperty('--dynamic-accent-muted', colors.accentMuted);
  root.style.setProperty('--dynamic-accent-fill', colors.accentFill);
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
