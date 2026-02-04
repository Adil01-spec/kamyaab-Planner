/**
 * useCollaboratorAccess Hook
 * 
 * Determines current user's access level on a plan.
 * Returns whether user is owner, collaborator, and their role.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type CollaboratorRole } from '@/lib/collaboration';

interface CollaboratorAccessResult {
  isOwner: boolean;
  isCollaborator: boolean;
  role: 'owner' | CollaboratorRole | null;
  canComment: boolean;
  canEdit: boolean;
  loading: boolean;
}

export function useCollaboratorAccess(planId: string | null): CollaboratorAccessResult {
  const { user } = useAuth();
  const [result, setResult] = useState<CollaboratorAccessResult>({
    isOwner: false,
    isCollaborator: false,
    role: null,
    canComment: false,
    canEdit: false,
    loading: true,
  });

  const checkAccess = useCallback(async () => {
    if (!planId || !user) {
      setResult({
        isOwner: false,
        isCollaborator: false,
        role: null,
        canComment: false,
        canEdit: false,
        loading: false,
      });
      return;
    }

    try {
      // Call the security definer function to get role
      const { data, error } = await supabase
        .rpc('get_collaboration_role', { _plan_id: planId });

      if (error) {
        console.error('Error checking collaboration role:', error);
        // Fallback: check if user owns the plan
        const { data: planData } = await supabase
          .from('plans')
          .select('user_id')
          .eq('id', planId)
          .maybeSingle();

        const isOwner = planData?.user_id === user.id;
        setResult({
          isOwner,
          isCollaborator: false,
          role: isOwner ? 'owner' : null,
          canComment: isOwner,
          canEdit: isOwner,
          loading: false,
        });
        return;
      }

      const role = data as 'owner' | 'viewer' | 'commenter' | null;
      
      setResult({
        isOwner: role === 'owner',
        isCollaborator: role === 'viewer' || role === 'commenter',
        role,
        canComment: role === 'owner' || role === 'commenter',
        canEdit: role === 'owner',
        loading: false,
      });
    } catch (err) {
      console.error('Error checking access:', err);
      setResult({
        isOwner: false,
        isCollaborator: false,
        role: null,
        canComment: false,
        canEdit: false,
        loading: false,
      });
    }
  }, [planId, user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return result;
}
