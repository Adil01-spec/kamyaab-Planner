import { useState, useEffect, useCallback } from 'react';

export type BackgroundPattern = 'orbs' | 'geometric' | 'waves' | 'particles' | 'seasonal';

export interface DesktopSettings {
  cursorEffects: boolean;
  parallaxEffects: boolean;
  breathingAnimation: boolean;
  hoverAnimations: boolean;
  performanceMode: boolean;
  dynamicBackground: boolean;
  backgroundPattern: BackgroundPattern;
}

// Boolean-only settings for toggle operations
type BooleanSettingKey = Exclude<keyof DesktopSettings, 'backgroundPattern'>;

// Default settings - effects enabled by default on desktop
const DEFAULT_SETTINGS: DesktopSettings = {
  cursorEffects: true,
  parallaxEffects: true,
  breathingAnimation: true,
  hoverAnimations: true,
  performanceMode: false,
  dynamicBackground: false, // Off by default (power intensive)
  backgroundPattern: 'orbs', // Default pattern
};

// GPU-intensive features that performance mode disables
const GPU_INTENSIVE_KEYS: BooleanSettingKey[] = [
  'cursorEffects',
  'parallaxEffects',
  'breathingAnimation',
  'hoverAnimations',
  'dynamicBackground',
];

const STORAGE_KEY = 'desktop-settings';

export function useDesktopSettings() {
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop device
  useEffect(() => {
    const checkDesktop = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsDesktop(!isMobileDevice && (!isTouchDevice || window.innerWidth >= 768));
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.debug('Failed to load desktop settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<DesktopSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.debug('Failed to save desktop settings:', error);
      }
      return newSettings;
    });
  }, []);

  const toggleSetting = useCallback((key: BooleanSettingKey) => {
    if (key === 'performanceMode') {
      // Toggle performance mode and update GPU-intensive features accordingly
      const newPerformanceMode = !settings.performanceMode;
      const updates: Partial<DesktopSettings> = { performanceMode: newPerformanceMode };
      
      if (newPerformanceMode) {
        // Turning ON performance mode = disable all GPU-intensive features
        GPU_INTENSIVE_KEYS.forEach(k => {
          updates[k] = false;
        });
      } else {
        // Turning OFF performance mode = enable all GPU-intensive features
        GPU_INTENSIVE_KEYS.forEach(k => {
          updates[k] = true;
        });
      }
      
      updateSettings(updates);
    } else {
      // If enabling a GPU-intensive feature, disable performance mode
      const isGpuIntensive = GPU_INTENSIVE_KEYS.includes(key);
      const turningOn = !settings[key];
      
      if (isGpuIntensive && turningOn) {
        updateSettings({ [key]: true, performanceMode: false });
      } else {
        updateSettings({ [key]: !settings[key] });
      }
    }
  }, [settings, updateSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.debug('Failed to reset desktop settings:', error);
    }
  }, []);

  return {
    settings,
    isDesktop,
    updateSettings,
    toggleSetting,
    resetToDefaults,
  };
}

// Singleton for accessing settings without hook
let cachedSettings: DesktopSettings | null = null;

export function getDesktopSettings(): DesktopSettings {
  if (cachedSettings) return cachedSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      return cachedSettings;
    }
  } catch {
    // Fall through to defaults
  }
  
  return DEFAULT_SETTINGS;
}

export function updateDesktopSettingsCache(settings: DesktopSettings) {
  cachedSettings = settings;
}
