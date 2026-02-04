/**
 * PlanCommentsSection
 * 
 * Section on /review page showing all comments grouped by target.
 * Collapsible by default.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { usePlanComments } from '@/hooks/usePlanComments';
import { useCollaboratorAccess } from '@/hooks/useCollaboratorAccess';
import { CommentThread } from './CommentThread';
import { Loader2 } from 'lucide-react';

interface PlanCommentsSectionProps {
  planId: string;
}

export function PlanCommentsSection({ planId }: PlanCommentsSectionProps) {
  const { 
    comments, 
    groupedComments, 
    loading,
    addComment,
    editComment,
    deleteComment,
  } = usePlanComments(planId);
  
  const { canComment, isOwner, isCollaborator } = useCollaboratorAccess(planId);

  // Only show if there are comments OR user can comment
  const hasComments = comments.length > 0;
  const shouldShow = hasComments || canComment;

  if (!shouldShow) return null;

  const totalCount = comments.length;

  return (
    <Collapsible defaultOpen={false}>
      <Card className="glass-card animate-slide-up overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">Plan Comments</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {totalCount > 0 
                      ? `${totalCount} comment${totalCount === 1 ? '' : 's'} from collaborators`
                      : 'Feedback from your collaborators'
                    }
                  </p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Plan-level comments */}
                <CommentThread
                  title="General Comments"
                  comments={groupedComments.plan}
                  canComment={canComment}
                  onAdd={(content) => addComment('plan', content)}
                  onEdit={editComment}
                  onDelete={deleteComment}
                  defaultOpen={groupedComments.plan.length > 0}
                />

                {/* Task comments */}
                {Object.keys(groupedComments.task).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Task Comments</h4>
                    {Object.entries(groupedComments.task).map(([ref, taskComments]) => (
                      <CommentThread
                        key={ref}
                        title={`Task: ${ref.replace('week-', 'Week ').replace('-task-', ', Task ')}`}
                        comments={taskComments}
                        canComment={canComment}
                        onAdd={(content) => addComment('task', content, ref)}
                        onEdit={editComment}
                        onDelete={deleteComment}
                      />
                    ))}
                  </div>
                )}

                {/* Insight comments */}
                {Object.keys(groupedComments.insight).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Insight Comments</h4>
                    {Object.entries(groupedComments.insight).map(([ref, insightComments]) => (
                      <CommentThread
                        key={ref}
                        title={ref}
                        comments={insightComments}
                        canComment={canComment}
                        onAdd={(content) => addComment('insight', content, ref)}
                        onEdit={editComment}
                        onDelete={deleteComment}
                      />
                    ))}
                  </div>
                )}

                {!hasComments && canComment && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Start the conversation!
                  </p>
                )}
              </>
            )}

            {/* Disclaimer for owners */}
            {isOwner && (
              <p className="text-xs text-muted-foreground text-center">
                Comments are visible to all collaborators on this plan.
              </p>
            )}

            {/* Disclaimer for collaborators */}
            {isCollaborator && (
              <p className="text-xs text-muted-foreground text-center">
                Your feedback helps the plan owner improve.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
