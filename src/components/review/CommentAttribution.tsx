/**
 * Comment Attribution Component
 * 
 * Renders author info for comments, handling both authenticated
 * and soft (external) authors based on is_soft_author flag.
 */

import { Badge } from '@/components/ui/badge';

interface CommentAttributionProps {
  authorName: string;
  isSoftAuthor?: boolean;
  softAuthorEmail?: string | null;
}

export function CommentAttribution({
  authorName,
  isSoftAuthor = false,
  softAuthorEmail,
}: CommentAttributionProps) {
  const displayName = isSoftAuthor
    ? (softAuthorEmail?.split('@')[0] || authorName)
    : authorName;

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-foreground">{displayName}</span>
      {isSoftAuthor && (
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-accent text-accent-foreground">
          External
        </Badge>
      )}
    </span>
  );
}
