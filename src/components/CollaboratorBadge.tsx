/**
 * CollaboratorBadge
 * 
 * Small badge showing the current user's collaboration role.
 * Displayed to collaborators on /plan and /review pages.
 */

import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare } from 'lucide-react';
import { type CollaboratorRole, formatRole } from '@/lib/collaboration';

interface CollaboratorBadgeProps {
  role: CollaboratorRole;
  className?: string;
}

export function CollaboratorBadge({ role, className }: CollaboratorBadgeProps) {
  const Icon = role === 'viewer' ? Eye : MessageSquare;
  
  return (
    <Badge 
      variant="outline" 
      className={`bg-accent/10 text-accent-foreground border-accent/30 ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      Viewing as {formatRole(role)}
    </Badge>
  );
}
