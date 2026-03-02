import { useState, useCallback, useEffect } from 'react';

interface SoftCollabSession {
  sessionToken: string;
  planId: string;
  role: 'viewer' | 'commenter';
}

const STORAGE_KEY = 'soft_collab_session';

export function useSoftCollabSession() {
  const [session, setSession] = useState<SoftCollabSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveSession = useCallback((data: SoftCollabSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSession(data);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setSession(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setSession(null);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return {
    sessionToken: session?.sessionToken ?? null,
    planId: session?.planId ?? null,
    role: session?.role ?? null,
    isActive: !!session,
    saveSession,
    clearSession,
  };
}
