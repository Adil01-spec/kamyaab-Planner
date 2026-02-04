/**
 * usePlanComments Hook
 * 
 * Manages comments for a plan - fetch, add, edit, soft-delete.
 * Grouped by target type for easy UI rendering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type PlanComment } from '@/lib/collaboration';
import { toast } from '@/hooks/use-toast';

interface GroupedComments {
  plan: PlanComment[];
  task: Record<string, PlanComment[]>; // keyed by targetRef
  insight: Record<string, PlanComment[]>; // keyed by targetRef
}

interface UsePlanCommentsResult {
  comments: PlanComment[];
  groupedComments: GroupedComments;
  loading: boolean;
  error: string | null;
  addComment: (targetType: 'plan' | 'task' | 'insight', content: string, targetRef?: string) => Promise<boolean>;
  editComment: (id: string, content: string) => Promise<boolean>;
  deleteComment: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  getCommentsForTarget: (targetType: 'plan' | 'task' | 'insight', targetRef?: string) => PlanComment[];
  getCommentCount: (targetType: 'plan' | 'task' | 'insight', targetRef?: string) => number;
}

export function usePlanComments(planId: string | null): UsePlanCommentsResult {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group comments by target type
  const groupedComments = useMemo<GroupedComments>(() => {
    const grouped: GroupedComments = {
      plan: [],
      task: {},
      insight: {},
    };

    comments.forEach(comment => {
      if (comment.targetType === 'plan') {
        grouped.plan.push(comment);
      } else if (comment.targetType === 'task') {
        const ref = comment.targetRef || 'unknown';
        if (!grouped.task[ref]) grouped.task[ref] = [];
        grouped.task[ref].push(comment);
      } else if (comment.targetType === 'insight') {
        const ref = comment.targetRef || 'unknown';
        if (!grouped.insight[ref]) grouped.insight[ref] = [];
        grouped.insight[ref].push(comment);
      }
    });

    return grouped;
  }, [comments]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!planId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plan_comments')
        .select('*')
        .eq('plan_id', planId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: PlanComment[] = (data || []).map(row => ({
        id: row.id,
        planId: row.plan_id,
        authorId: row.author_id,
        authorName: row.author_name,
        targetType: row.target_type as 'plan' | 'task' | 'insight',
        targetRef: row.target_ref,
        content: row.content,
        createdAt: row.created_at,
        editedAt: row.edited_at,
        deletedAt: row.deleted_at,
      }));

      setComments(mapped);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Add comment
  const addComment = useCallback(async (
    targetType: 'plan' | 'task' | 'insight',
    content: string,
    targetRef?: string
  ): Promise<boolean> => {
    if (!planId || !user) return false;

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 500) {
      toast({
        title: 'Invalid comment',
        description: 'Comment must be 1-500 characters.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const authorName = profile?.fullName || user.email?.split('@')[0] || 'Anonymous';

      const { error: insertError } = await supabase
        .from('plan_comments')
        .insert({
          plan_id: planId,
          author_id: user.id,
          author_name: authorName,
          target_type: targetType,
          target_ref: targetRef || null,
          content: trimmedContent,
        });

      if (insertError) throw insertError;

      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Failed to add comment',
        description: 'Could not post your comment. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [planId, user, profile, fetchComments]);

  // Edit comment (author only)
  const editComment = useCallback(async (id: string, content: string): Promise<boolean> => {
    if (!user) return false;

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 500) {
      toast({
        title: 'Invalid comment',
        description: 'Comment must be 1-500 characters.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('plan_comments')
        .update({ 
          content: trimmedContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('author_id', user.id);

      if (updateError) throw updateError;

      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error editing comment:', err);
      toast({
        title: 'Failed to edit',
        description: 'Could not update your comment. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, fetchComments]);

  // Delete comment (soft delete, author only)
  const deleteComment = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('plan_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('author_id', user.id);

      if (updateError) throw updateError;

      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'Failed to delete',
        description: 'Could not delete your comment. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, fetchComments]);

  // Get comments for a specific target
  const getCommentsForTarget = useCallback((
    targetType: 'plan' | 'task' | 'insight',
    targetRef?: string
  ): PlanComment[] => {
    if (targetType === 'plan') {
      return groupedComments.plan;
    }
    const refKey = targetRef || 'unknown';
    if (targetType === 'task') {
      return groupedComments.task[refKey] || [];
    }
    return groupedComments.insight[refKey] || [];
  }, [groupedComments]);

  // Get comment count for a target
  const getCommentCount = useCallback((
    targetType: 'plan' | 'task' | 'insight',
    targetRef?: string
  ): number => {
    return getCommentsForTarget(targetType, targetRef).length;
  }, [getCommentsForTarget]);

  return {
    comments,
    groupedComments,
    loading,
    error,
    addComment,
    editComment,
    deleteComment,
    refetch: fetchComments,
    getCommentsForTarget,
    getCommentCount,
  };
}
