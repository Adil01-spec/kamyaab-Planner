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
  subscription_tier: string | null;
  subscription_state: string | null;
  subscription_expires_at: string | null;
  subscription_provider: string | null;
  grace_ends_at: string | null;
  email_verified_at: string | null;
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
  subscriptionTier: string;
  subscriptionState: string;
  subscriptionExpiresAt: string | null;
  subscriptionProvider: string | null;
  graceEndsAt: string | null;
  emailVerifiedAt: string | null;
}

// Profile data that can be saved (subscription fields managed separately)
interface SaveProfileData {
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
  isEmailVerified: boolean;
  isOAuthUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
  saveProfile: (data: SaveProfileData) => Promise<void>;
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
    subscriptionTier: dbProfile.subscription_tier || 'standard',
    subscriptionState: dbProfile.subscription_state || 'active',
    subscriptionExpiresAt: dbProfile.subscription_expires_at || null,
    subscriptionProvider: dbProfile.subscription_provider || null,
    graceEndsAt: dbProfile.grace_ends_at || null,
    emailVerifiedAt: dbProfile.email_verified_at || null,
  });

  // Determine if user signed in via OAuth (Google/Apple)
  const isOAuthUser = user?.app_metadata?.provider === 'google' || 
                      user?.app_metadata?.provider === 'apple' ||
                      (user?.app_metadata?.providers || []).some((p: string) => ['google', 'apple'].includes(p));

  // Email is verified if:
  // 1. OAuth user (already verified by provider)
  // 2. Profile has email_verified_at set
  const isEmailVerified = isOAuthUser || !!profile?.emailVerifiedAt;

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

  // Auth state listener — synchronous only, no await
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing session');
          clearPartialSession();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile when user changes — separate from auth callback to avoid SDK lock deadlock
  useEffect(() => {
    if (user === null) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchProfile(user.id).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

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

  const saveProfile = async (data: SaveProfileData) => {
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
    <AuthContext.Provider value={{ user, session, profile, loading, isEmailVerified, isOAuthUser, signIn, signUp, signInWithGoogle, logout, saveProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
