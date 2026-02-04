/**
 * CommentThread
 * 
 * Collapsible comment thread for a specific target.
 * Supports adding, editing, and deleting comments.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  MessageSquare, ChevronDown, Send, Pencil, Trash2, X, Check, Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { type PlanComment, formatCommentTime, getInitials } from '@/lib/collaboration';

interface CommentThreadProps {
  title: string;
  comments: PlanComment[];
  canComment: boolean;
  onAdd: (content: string) => Promise<boolean>;
  onEdit: (id: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  defaultOpen?: boolean;
}

export function CommentThread({
  title,
  comments,
  canComment,
  onAdd,
  onEdit,
  onDelete,
  defaultOpen = false,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [newComment, setNewComment] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setIsAdding(true);
    const success = await onAdd(newComment.trim());
    if (success) {
      setNewComment('');
    }
    setIsAdding(false);
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    const success = await onEdit(id, editContent.trim());
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const startEdit = (comment: PlanComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (comments.length === 0 && !canComment) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {title}
            {comments.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </span>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-3">
        {/* Existing comments */}
        {comments.map((comment) => (
          <div 
            key={comment.id}
            className="flex gap-3 p-3 rounded-lg bg-muted/30"
          >
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(comment.authorName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCommentTime(comment.createdAt)}
                  {comment.editedAt && ' (edited)'}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}

              {/* Actions for own comments */}
              {user?.id === comment.authorId && editingId !== comment.id && (
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => startEdit(comment)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add new comment */}
        {canComment && (
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] text-sm flex-1"
              maxLength={500}
            />
            <Button
              size="icon"
              onClick={handleAdd}
              disabled={isAdding || !newComment.trim()}
              className="shrink-0"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
