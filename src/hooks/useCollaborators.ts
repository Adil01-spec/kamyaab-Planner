/**
 * useCollaborators Hook
 * 
 * Manages collaborators for a plan - fetch, add, remove, update roles.
 * Enforces tier-based limits.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  type Collaborator, 
  type CollaboratorRole,
  canAddCollaborator,
  getCollaboratorLimit,
  isValidEmail
} from '@/lib/collaboration';
import { toast } from '@/hooks/use-toast';

interface UseCollaboratorsResult {
  collaborators: Collaborator[];
  loading: boolean;
  error: string | null;
  canAdd: boolean;
  limit: number;
  addCollaborator: (email: string, role: CollaboratorRole) => Promise<boolean>;
  removeCollaborator: (id: string) => Promise<boolean>;
  updateRole: (id: string, role: CollaboratorRole) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCollaborators(planId: string | null): UseCollaboratorsResult {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = getCollaboratorLimit(tier);
  const canAdd = canAddCollaborator(tier, collaborators.length);

  // Fetch collaborators
  const fetchCollaborators = useCallback(async () => {
    if (!planId || !user) {
      setCollaborators([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plan_collaborators')
        .select('*')
        .eq('plan_id', planId)
        .eq('owner_id', user.id);

      if (fetchError) throw fetchError;

      const mapped: Collaborator[] = (data || []).map(row => ({
        id: row.id,
        planId: row.plan_id,
        ownerId: row.owner_id,
        email: row.collaborator_email,
        userId: row.collaborator_user_id,
        role: row.role as CollaboratorRole,
        invitedAt: row.invited_at,
        acceptedAt: row.accepted_at,
      }));

      setCollaborators(mapped);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [planId, user]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Add collaborator
  const addCollaborator = useCallback(async (email: string, role: CollaboratorRole): Promise<boolean> => {
    if (!planId || !user) return false;

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email
    if (!isValidEmail(trimmedEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return false;
    }

    // Check limit
    if (!canAddCollaborator(tier, collaborators.length)) {
      toast({
        title: 'Limit reached',
        description: `You can only have ${limit} collaborator${limit === 1 ? '' : 's'} on your plan.`,
        variant: 'destructive',
      });
      return false;
    }

    // Check for duplicate
    if (collaborators.some(c => c.email === trimmedEmail)) {
      toast({
        title: 'Already invited',
        description: 'This person is already a collaborator.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('plan_collaborators')
        .insert({
          plan_id: planId,
          owner_id: user.id,
          collaborator_email: trimmedEmail,
          role: role,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast({
            title: 'Already invited',
            description: 'This person is already a collaborator.',
            variant: 'destructive',
          });
          return false;
        }
        throw insertError;
      }

      // Send invitation email via edge function
      try {
        const { data: planData } = await supabase
          .from('plans')
          .select('plan_json')
          .eq('id', planId)
          .single();
        
        const planJson = planData?.plan_json as { title?: string } | null;
        const planTitle = planJson?.title || 'Untitled Plan';
        const ownerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
        
        await supabase.functions.invoke('send-collaboration-invite', {
          body: {
            collaboratorEmail: trimmedEmail,
            ownerName,
            planTitle,
            role,
            appUrl: window.location.origin,
          },
        });
      } catch (emailError) {
        // Email sending is non-blocking - log but don't fail the invite
        console.error('Failed to send invitation email:', emailError);
      }

      toast({
        title: 'Collaborator added',
        description: `${trimmedEmail} can now view your plan.`,
      });

      await fetchCollaborators();
      return true;
    } catch (err) {
      console.error('Error adding collaborator:', err);
      toast({
        title: 'Failed to add',
        description: 'Could not add collaborator. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [planId, user, tier, collaborators, limit, fetchCollaborators]);

  // Remove collaborator
  const removeCollaborator = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('plan_collaborators')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Collaborator removed',
        description: 'Access has been revoked.',
      });

      await fetchCollaborators();
      return true;
    } catch (err) {
      console.error('Error removing collaborator:', err);
      toast({
        title: 'Failed to remove',
        description: 'Could not remove collaborator. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, fetchCollaborators]);

  // Update role
  const updateRole = useCallback(async (id: string, role: CollaboratorRole): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('plan_collaborators')
        .update({ role })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Role updated',
        description: `Changed to ${role === 'viewer' ? 'Viewer' : 'Commenter'}.`,
      });

      await fetchCollaborators();
      return true;
    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        title: 'Failed to update',
        description: 'Could not update role. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, fetchCollaborators]);

  return {
    collaborators,
    loading,
    error,
    canAdd,
    limit,
    addCollaborator,
    removeCollaborator,
    updateRole,
    refetch: fetchCollaborators,
  };
}
