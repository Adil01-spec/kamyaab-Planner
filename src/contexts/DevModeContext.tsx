import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// ======== SECURITY CONFIG - MODIFY THESE ========
// Add your email(s) to enable dev mode in production
const ALLOWED_DEV_EMAILS: string[] = [
  "rajaadil4445@gmail.com",
];

// Secret activation code - change this to your own code
const DEV_ACTIVATION_CODE = 'kaamyab-dev-2026';

// Storage key for activation
const STORAGE_KEY = 'kaamyab_dev_mode';

// Activation expires after 24 hours
const EXPIRY_HOURS = 24;
// ================================================

interface StoredActivation {
  activatedAt: number;
  hash: string;
}

interface DevModeContextType {
  isDevMode: boolean;
  isAllowedUser: boolean;
  activateDevMode: (code: string) => boolean;
  deactivateDevMode: () => void;
  showActivator: boolean;
  setShowActivator: (show: boolean) => void;
}

const DevModeContext = createContext<DevModeContextType | null>(null);

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};

// Simple hash function for code comparison (not cryptographic, but sufficient for dev mode)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);
  const [showActivator, setShowActivator] = useState(false);

  // Check if current user email is in the allowed list
  const isAllowedUser = user?.email ? ALLOWED_DEV_EMAILS.includes(user.email) : false;

  // Check stored activation on mount
  useEffect(() => {
    // Always enable in development
    if (import.meta.env.DEV) {
      setIsDevMode(true);
      return;
    }

    // In production, check stored activation
    if (!isAllowedUser) {
      setIsDevMode(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsDevMode(false);
        return;
      }

      const activation: StoredActivation = JSON.parse(stored);
      const now = Date.now();
      const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
      
      // Check if expired
      if (now - activation.activatedAt > expiryMs) {
        localStorage.removeItem(STORAGE_KEY);
        setIsDevMode(false);
        return;
      }

      // Verify hash
      const expectedHash = simpleHash(DEV_ACTIVATION_CODE);
      if (activation.hash === expectedHash) {
        setIsDevMode(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setIsDevMode(false);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsDevMode(false);
    }
  }, [isAllowedUser]);

  const activateDevMode = useCallback((code: string): boolean => {
    // Always enabled in dev
    if (import.meta.env.DEV) return true;

    // Must be allowed user
    if (!isAllowedUser) return false;

    // Verify code
    if (code !== DEV_ACTIVATION_CODE) return false;

    // Store activation
    const activation: StoredActivation = {
      activatedAt: Date.now(),
      hash: simpleHash(code),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activation));
    setIsDevMode(true);
    return true;
  }, [isAllowedUser]);

  const deactivateDevMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsDevMode(false);
  }, []);

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
        isAllowedUser,
        activateDevMode,
        deactivateDevMode,
        showActivator,
        setShowActivator,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
};
