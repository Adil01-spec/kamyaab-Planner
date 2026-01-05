import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { requiresRedirectAuth, clearPartialSession } from '@/lib/browserDetection';

interface UserProfile {
  id: string;
  full_name: string | null;
  profession: string | null;
  profession_details: Record<string, any>;
  project_title: string | null;
  project_description: string | null;
  project_deadline: string | null;
  created_at: string;
}

// Mapped profile interface for component compatibility
interface MappedProfile {
  fullName: string;
  profession: string;
  professionDetails: Record<string, any>;
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: MappedProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
  saveProfile: (data: Omit<MappedProfile, 'createdAt'>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MappedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const mapProfile = (dbProfile: UserProfile): MappedProfile => ({
    fullName: dbProfile.full_name || '',
    profession: dbProfile.profession || '',
    professionDetails: dbProfile.profession_details || {},
    projectTitle: dbProfile.project_title || '',
    projectDescription: dbProfile.project_description || '',
    projectDeadline: dbProfile.project_deadline || '',
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(mapProfile(data as UserProfile));
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle token errors (common on iOS Safari after OAuth)
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing session');
          clearPartialSession();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Handle sign in errors
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Handle stale/invalid tokens
        if (error) {
          const isTokenError = error.message?.includes('Refresh Token') || 
                               error.message?.includes('token') ||
                               error.message?.includes('signature');
          if (isTokenError) {
            console.warn('Invalid session token, clearing');
            clearPartialSession();
            await supabase.auth.signOut();
          }
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        // Validate session has required tokens
        if (session && (!session.access_token || !session.refresh_token)) {
          console.warn('Incomplete session, clearing');
          clearPartialSession();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
        setLoading(false);
      } catch (err) {
        console.error('Session init error:', err);
        clearPartialSession();
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/onboarding`;
    
    // Clear any partial/stale session before OAuth
    clearPartialSession();
    
    try {
      // Always use redirect flow - more reliable across all browsers
      // Especially critical for iOS Safari which blocks popups
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false, // Ensure we do a full redirect
          queryParams: {
            prompt: 'select_account', // Force account selection
          },
        },
      });
      
      if (error) {
        // Don't show raw token errors to user
        if (error.message?.includes('token') || error.message?.includes('signature')) {
          console.error('OAuth token error:', error);
          clearPartialSession();
          return { error: { message: 'Sign in failed. Please try again.' } };
        }
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      console.error('OAuth error:', err);
      clearPartialSession();
      return { error: { message: 'Sign in failed. Please try again.' } };
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const saveProfile = async (data: Omit<MappedProfile, 'createdAt'>) => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: data.fullName,
        profession: data.profession,
        profession_details: data.professionDetails,
        project_title: data.projectTitle,
        project_description: data.projectDescription,
        project_deadline: data.projectDeadline,
      });

    if (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
    
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signInWithGoogle, logout, saveProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
