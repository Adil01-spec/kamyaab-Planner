/**
 * CollaborationModal
 * 
 * Modal for managing plan collaborators.
 * Invite by email, list accepted collaborators + pending invites, update roles, remove.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserPlus, X, Eye, MessageSquare, Check, Clock } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  type CollaboratorRole, 
  getInitials,
  formatCommentTime,
  getCollaboratorLimit
} from '@/lib/collaboration';

interface CollaborationModalProps {
  planId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollaborationModal({ planId, open, onOpenChange }: CollaborationModalProps) {
  const { tier } = useSubscription();
  const {
    collaborators,
    pendingInvites,
    loading,
    canAdd,
    limit,
    addCollaborator,
    removeCollaborator,
    removePendingInvite,
    updateRole,
  } = useCollaborators(planId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('viewer');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setIsAdding(true);
    const success = await addCollaborator(email, role);
    if (success) {
      setEmail('');
      setRole('viewer');
    }
    setIsAdding(false);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await removeCollaborator(id);
    setRemovingId(null);
  };

  const handleRemovePending = async (id: string) => {
    setRemovingId(id);
    await removePendingInvite(id);
    setRemovingId(null);
  };

  const handleRoleChange = async (id: string, newRole: CollaboratorRole) => {
    await updateRole(id, newRole);
  };

  const tierLabel = tier === 'business' ? 'Business' : 'Pro';
  const totalCount = collaborators.length + pendingInvites.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Collaborate on Your Plan
          </DialogTitle>
          <DialogDescription>
            Invite others to view your plan and leave feedback.
          </DialogDescription>
        </DialogHeader>

        {/* Invite form */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canAdd || isAdding}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Select 
              value={role} 
              onValueChange={(v) => setRole(v as CollaboratorRole)}
              disabled={!canAdd || isAdding}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    Viewer
                  </span>
                </SelectItem>
                <SelectItem value="commenter">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Commenter
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleInvite} 
              disabled={!canAdd || isAdding || !email.trim()}
              size="icon"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>

          {!canAdd && totalCount >= limit && (
            <p className="text-xs text-muted-foreground">
              You've reached your {tierLabel} limit of {limit} collaborator{limit === 1 ? '' : 's'}.
            </p>
          )}
        </div>

        <Separator />

        {/* Collaborator + pending list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Collaborators
            </span>
            <span className="text-xs text-muted-foreground">
              {totalCount} of {limit} on {tierLabel}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : totalCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No collaborators yet
            </p>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {/* Accepted collaborators */}
              {collaborators.map((collab) => (
                <div 
                  key={collab.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(collab.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{collab.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {collab.acceptedAt 
                        ? `Joined ${formatCommentTime(collab.acceptedAt)}`
                        : `Invited ${formatCommentTime(collab.invitedAt)}`
                      }
                    </p>
                  </div>
                  <Select 
                    value={collab.role} 
                    onValueChange={(v) => handleRoleChange(collab.id, v as CollaboratorRole)}
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(collab.id)}
                    disabled={removingId === collab.id}
                  >
                    {removingId === collab.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}

              {/* Pending invites */}
              {pendingInvites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-dashed border-border"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {getInitials(invite.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {formatCommentTime(invite.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemovePending(invite.id)}
                    disabled={removingId === invite.id}
                  >
                    {removingId === invite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p><strong>Viewers</strong> can see your plan and review.</p>
          <p><strong>Commenters</strong> can also leave feedback.</p>
          <p className="mt-1">Collaborators cannot modify your tasks or execution.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
