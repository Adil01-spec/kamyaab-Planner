/**
 * useCollaborators Hook
 * 
 * Manages collaborators for a plan - fetch accepted + pending, add via plan_invites, remove, update roles.
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

export interface PendingInvite {
  id: string;
  email: string;
  role: CollaboratorRole;
  token: string;
  createdAt: string;
  expiresAt: string;
}

interface UseCollaboratorsResult {
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
  loading: boolean;
  error: string | null;
  canAdd: boolean;
  limit: number;
  addCollaborator: (email: string, role: CollaboratorRole) => Promise<boolean>;
  removeCollaborator: (id: string) => Promise<boolean>;
  removePendingInvite: (id: string) => Promise<boolean>;
  updateRole: (id: string, role: CollaboratorRole) => Promise<boolean>;
  resendInvite: (invite: PendingInvite) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCollaborators(planId: string | null): UseCollaboratorsResult {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = getCollaboratorLimit(tier);
  const totalCount = collaborators.length + pendingInvites.length;
  const canAdd = canAddCollaborator(tier, totalCount);

  // Fetch collaborators + pending invites
  const fetchAll = useCallback(async () => {
    if (!planId || !user) {
      setCollaborators([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch accepted collaborators
      const { data: collabData, error: collabError } = await supabase
        .from('plan_collaborators')
        .select('*')
        .eq('plan_id', planId)
        .eq('owner_id', user.id);

      if (collabError) throw collabError;

      const mapped: Collaborator[] = (collabData || []).map(row => ({
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

      // Fetch pending invites (not accepted, not expired)
      const { data: inviteData, error: inviteError } = await supabase
        .from('plan_invites')
        .select('*')
        .eq('plan_id', planId)
        .eq('owner_id', user.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (inviteError) throw inviteError;

      const mappedInvites: PendingInvite[] = (inviteData || []).map(row => ({
        id: row.id,
        email: row.collaborator_email,
        role: row.role as CollaboratorRole,
        token: row.token,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));
      setPendingInvites(mappedInvites);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [planId, user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Generate 128-bit hex token
  const generateToken = (): string => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Add collaborator (insert into plan_invites, NOT plan_collaborators)
  const addCollaborator = useCallback(async (email: string, role: CollaboratorRole): Promise<boolean> => {
    if (!planId || !user) return false;

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return false;
    }

    if (!canAddCollaborator(tier, totalCount)) {
      toast({ title: 'Limit reached', description: `You can only have ${limit} collaborator${limit === 1 ? '' : 's'} on your plan.`, variant: 'destructive' });
      return false;
    }

    // Check for duplicate in accepted collaborators
    if (collaborators.some(c => c.email === trimmedEmail)) {
      toast({ title: 'Already a collaborator', description: 'This person already has access.', variant: 'destructive' });
      return false;
    }

    // Check for duplicate in pending invites
    if (pendingInvites.some(i => i.email === trimmedEmail)) {
      toast({ title: 'Already invited', description: 'An invitation is already pending for this email.', variant: 'destructive' });
      return false;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { error: insertError } = await supabase
        .from('plan_invites')
        .insert({
          plan_id: planId,
          owner_id: user.id,
          collaborator_email: trimmedEmail,
          role,
          token,
          expires_at: expiresAt,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast({ title: 'Already invited', description: 'This person already has a pending invitation.', variant: 'destructive' });
          return false;
        }
        throw insertError;
      }

      // Send invitation email with token
      try {
        const ownerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';
        
        await supabase.functions.invoke('send-collaboration-invite', {
          body: {
            collaboratorEmail: trimmedEmail,
            ownerName,
            planId,
            token,
            role,
            appUrl: window.location.origin,
          },
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }

      toast({ title: 'Invitation sent', description: `${trimmedEmail} will receive an invite link.` });
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Error adding collaborator:', err);
      toast({ title: 'Failed to invite', description: 'Could not send invitation. Please try again.', variant: 'destructive' });
      return false;
    }
  }, [planId, user, tier, totalCount, collaborators, pendingInvites, limit, fetchAll]);

  // Remove accepted collaborator
  const removeCollaborator = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error: deleteError } = await supabase
        .from('plan_collaborators')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      if (deleteError) throw deleteError;
      toast({ title: 'Collaborator removed', description: 'Access has been revoked.' });
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Error removing collaborator:', err);
      toast({ title: 'Failed to remove', description: 'Could not remove collaborator. Please try again.', variant: 'destructive' });
      return false;
    }
  }, [user, fetchAll]);

  // Remove pending invite
  const removePendingInvite = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error: deleteError } = await supabase
        .from('plan_invites')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);
      if (deleteError) throw deleteError;
      toast({ title: 'Invitation cancelled', description: 'The pending invite has been removed.' });
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Error removing invite:', err);
      toast({ title: 'Failed to cancel', description: 'Could not cancel invitation. Please try again.', variant: 'destructive' });
      return false;
    }
  }, [user, fetchAll]);

  // Resend access key email for a pending invite
  const resendInvite = useCallback(async (invite: PendingInvite): Promise<boolean> => {
    if (!planId || !user) return false;
    try {
      // Reset attempts and lockout
      await supabase
        .from('plan_invites')
        .update({ access_key_attempts: 0, locked_until: null })
        .eq('id', invite.id)
        .eq('owner_id', user.id);

      const ownerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';

      const { error: fnError } = await supabase.functions.invoke('send-collaboration-invite', {
        body: {
          collaboratorEmail: invite.email,
          ownerName,
          planId,
          token: invite.token,
          role: invite.role,
          appUrl: window.location.origin,
        },
      });

      if (fnError) throw fnError;

      toast({ title: 'Invitation resent', description: `A new access key was sent to ${invite.email}.` });
      return true;
    } catch (err) {
      console.error('Error resending invite:', err);
      toast({ title: 'Failed to resend', description: 'Could not resend invitation. Please try again.', variant: 'destructive' });
      return false;
    }
  }, [planId, user]);

  // Update role (accepted collaborators only)
  const updateRole = useCallback(async (id: string, role: CollaboratorRole): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error: updateError } = await supabase
        .from('plan_collaborators')
        .update({ role })
        .eq('id', id)
        .eq('owner_id', user.id);
      if (updateError) throw updateError;
      toast({ title: 'Role updated', description: `Changed to ${role === 'viewer' ? 'Viewer' : 'Commenter'}.` });
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Error updating role:', err);
      toast({ title: 'Failed to update', description: 'Could not update role. Please try again.', variant: 'destructive' });
      return false;
    }
  }, [user, fetchAll]);

  return {
    collaborators,
    pendingInvites,
    loading,
    error,
    canAdd,
    limit,
    addCollaborator,
    removeCollaborator,
    removePendingInvite,
    updateRole,
    resendInvite,
    refetch: fetchAll,
  };
}
