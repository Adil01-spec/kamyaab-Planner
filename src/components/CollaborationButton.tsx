/**
 * CollaborationButton
 * 
 * Subtle entry point on /plan page for collaboration.
 * Opens the CollaborationModal. Pro/Business only.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { hasCollaborationAccess, getCollaboratorLimit } from '@/lib/collaboration';
import { CollaborationModal } from './CollaborationModal';

interface CollaborationButtonProps {
  planId: string;
  collaboratorCount: number;
}

export function CollaborationButton({ planId, collaboratorCount }: CollaborationButtonProps) {
  const { tier } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  // Only show for Pro/Business
  if (!hasCollaborationAccess(tier)) {
    return null;
  }

  const limit = getCollaboratorLimit(tier);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-muted-foreground hover:text-foreground gap-2"
      >
        <Users className="w-4 h-4" />
        {collaboratorCount > 0 ? (
          <span className="text-xs">{collaboratorCount}/{limit}</span>
        ) : (
          <span className="hidden sm:inline text-xs">Share</span>
        )}
      </Button>

      <CollaborationModal
        planId={planId}
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}
