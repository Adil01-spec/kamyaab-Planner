import { useState, useEffect, useCallback } from 'react';

export type BreathingSpeed = 'slow' | 'medium' | 'fast';
export type BackgroundPattern = 'orbs' | 'geometric' | 'waves' | 'particles' | 'seasonal';

export interface MobileSettings {
  hapticFeedback: boolean;
  audioFeedback: boolean;
  parallaxEffects: boolean;
  breathingAnimation: boolean;
  breathingSpeed: BreathingSpeed;
  deviceMotion: boolean;
  swipeNavigation: boolean;
  performanceMode: boolean;
  dynamicBackground: boolean;
  backgroundPattern: BackgroundPattern;
}

// Default settings optimized for low-end devices
const DEFAULT_SETTINGS: MobileSettings = {
  hapticFeedback: true,       // Low resource - keep on
  audioFeedback: false,       // Audio can lag on low-end - off by default
  parallaxEffects: false,     // GPU intensive - off by default
  breathingAnimation: false,  // Continuous animation - off by default
  breathingSpeed: 'medium',   // Default to medium speed
  deviceMotion: false,        // Sensor polling - off by default
  swipeNavigation: true,      // Low resource - keep on
  performanceMode: true,      // On by default for low-end optimization
  dynamicBackground: false,   // GPU intensive - off by default
  backgroundPattern: 'orbs',  // Default pattern
};

// GPU-intensive boolean features that performance mode disables
type BooleanSettingKey = 'hapticFeedback' | 'audioFeedback' | 'parallaxEffects' | 'breathingAnimation' | 'deviceMotion' | 'swipeNavigation' | 'performanceMode' | 'dynamicBackground';

const GPU_INTENSIVE_KEYS: BooleanSettingKey[] = [
  'audioFeedback',
  'parallaxEffects',
  'breathingAnimation',
  'deviceMotion',
  'dynamicBackground',
];

const STORAGE_KEY = 'mobile-settings';

export function useMobileSettings() {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULT_SETTINGS);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || (isTouchDevice && window.innerWidth < 768));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      console.debug('Failed to load mobile settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<MobileSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.debug('Failed to save mobile settings:', error);
      }
      return newSettings;
    });
  }, []);

  const toggleSetting = useCallback((key: BooleanSettingKey) => {
    if (key === 'performanceMode') {
      // Toggle performance mode and update GPU-intensive features accordingly
      const newPerformanceMode = !settings.performanceMode;
      const updates: Partial<MobileSettings> = { performanceMode: newPerformanceMode };
      
      if (newPerformanceMode) {
        // Turning ON performance mode = disable all GPU-intensive features
        GPU_INTENSIVE_KEYS.forEach(k => {
          updates[k] = false;
        });
      }
      // Turning OFF performance mode doesn't auto-enable features (user controls individually)
      
      updateSettings(updates);
    } else {
      // If enabling a GPU-intensive feature, disable performance mode
      const isGpuIntensive = GPU_INTENSIVE_KEYS.includes(key);
      const currentValue = settings[key];
      const turningOn = !currentValue;
      
      if (isGpuIntensive && turningOn) {
        updateSettings({ [key]: true, performanceMode: false });
      } else {
        updateSettings({ [key]: !currentValue });
      }
    }
  }, [settings, updateSettings]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.debug('Failed to reset mobile settings:', error);
    }
  }, []);

  return {
    settings,
    isMobile,
    updateSettings,
    toggleSetting,
    resetToDefaults,
  };
}

// Singleton for accessing settings without hook (for utility functions)
let cachedSettings: MobileSettings | null = null;

export function getMobileSettings(): MobileSettings {
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

// Update cache when settings change
export function updateMobileSettingsCache(settings: MobileSettings) {
  cachedSettings = settings;
}
