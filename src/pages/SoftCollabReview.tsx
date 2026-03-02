import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSoftCollabSession } from '@/hooks/useSoftCollabSession';
import { Loader2, AlertCircle, MessageSquare, Send, LogOut, MessageCirclePlus, Lightbulb, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import kaamyabLogo from '@/assets/kaamyab-logo-clean.png';
import { formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
import SoftFeedbackForm from '@/components/SoftFeedbackForm';
import SoftFeedbackSummary from '@/components/SoftFeedbackSummary';
import SoftSuggestionForm from '@/components/SoftSuggestionForm';
import SoftActivityTimeline from '@/components/SoftActivityTimeline';
import SoftUpgradeBanner from '@/components/SoftUpgradeBanner';
import { CommentAttribution } from '@/components/review/CommentAttribution';

interface PlanComment {
  id: string;
  author_name: string;
  content: string;
  target_type: string;
  target_ref: string | null;
  created_at: string;
  is_soft_author?: boolean;
  soft_author_email?: string | null;
}

interface PlanTask {
  title: string;
  completed?: boolean;
  duration?: string;
}

interface PlanWeek {
  week: number;
  tasks: PlanTask[];
}

interface PlanJson {
  title?: string;
  description?: string;
  weeks?: PlanWeek[];
}

interface Suggestion {
  id: string;
  email: string;
  suggestion_type: string;
  target_ref: string | null;
  title: string | null;
  description: string;
  status: string;
  created_at: string;
}

const SoftCollabReview = () => {
  const { planId } = useParams<{ planId: string }>();
  const { sessionToken, planId: sessionPlanId, role, clearSession } = useSoftCollabSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlanJson | null>(null);
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dayClosure, setDayClosure] = useState<any[]>([]);
  const [planCreatedAt, setPlanCreatedAt] = useState('');
  const [sessionExpiresAt, setSessionExpiresAt] = useState('');
  const [email, setEmail] = useState('');

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  // Feedback form state
  const [feedbackTarget, setFeedbackTarget] = useState<{ type: 'plan' | 'week' | 'task'; ref?: string; label?: string } | null>(null);
  // Suggestion form state
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!sessionToken) {
      setError('No active session. Please use your invite link to access this plan.');
      setLoading(false);
      return;
    }

    if (planId && sessionPlanId && planId !== sessionPlanId) {
      setError('Your session does not grant access to this plan.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-plan-for-soft-session', {
        body: { session_token: sessionToken },
      });

      if (fnError || data?.error) {
        setError(data?.error || 'Session expired or invalid. Please use your invite link again.');
        return;
      }

      setPlanData(data.plan_json as PlanJson);
      setComments(data.comments || []);
      setFeedback(data.feedback || []);
      setSuggestions(data.suggestions || []);
      setDayClosure(data.day_closures || []);
      setPlanCreatedAt(data.created_at || '');
      setSessionExpiresAt(data.session_expires_at || '');
      setEmail(data.email || '');
    } catch {
      setError('Failed to load plan data.');
    } finally {
      setLoading(false);
    }
  }, [sessionToken, planId, sessionPlanId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !sessionToken) return;
    setPosting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('soft-collab-comment', {
        body: {
          session_token: sessionToken,
          target_type: 'plan',
          target_ref: null,
          content: commentText.trim(),
        },
      });

      if (fnError || data?.error) {
        console.error('Comment error:', data?.error);
        return;
      }

      if (data?.comment) {
        setComments(prev => [...prev, data.comment]);
      }
      setCommentText('');
    } catch {
      console.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleEndSession = () => {
    clearSession();
    window.location.href = '/';
  };

  // Session expiry display
  const getExpiryText = () => {
    if (!sessionExpiresAt) return null;
    const expires = new Date(sessionExpiresAt);
    const now = new Date();
    const hours = differenceInHours(expires, now);
    const mins = differenceInMinutes(expires, now) % 60;
    if (hours <= 0 && mins <= 0) return 'Expired';
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <img src={kaamyabLogo} alt="Kamyaab" className="w-14 h-14 rounded-2xl object-contain mb-4" />
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3 text-sm">Loading plan…</p>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-10 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Access Unavailable</h2>
            <p className="text-sm text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planTitle = planData.title?.trim() || 'Execution Plan';
  const weeks = planData.weeks || [];
  const totalTasks = weeks.reduce((sum, w) => sum + (w.tasks?.length || 0), 0);
  const completedTasks = weeks.reduce(
    (sum, w) => sum + (w.tasks?.filter((t) => t.completed)?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kaamyabLogo} alt="Kamyaab" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">{planTitle}</h1>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs bg-accent/50 text-accent-foreground border-accent">
              External Collaboration
            </Badge>
            {getExpiryText() && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getExpiryText()}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleEndSession} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{planTitle}</CardTitle>
            {planData.description && (
              <p className="text-sm text-muted-foreground">{planData.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{weeks.length} week{weeks.length !== 1 ? 's' : ''}</span>
              <span>{completedTasks}/{totalTasks} tasks completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Aggregated Feedback Summary */}
        <SoftFeedbackSummary feedback={feedback} />

        {/* Activity Timeline */}
        {planCreatedAt && (
          <SoftActivityTimeline
            dayClosure={dayClosure}
            planCreatedAt={planCreatedAt}
            totalTasks={totalTasks}
            completedTasks={completedTasks}
          />
        )}

        {/* Weeks */}
        {weeks.map((week) => (
          <Card key={week.week}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Week {week.week}</CardTitle>
                {role === 'commenter' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedbackTarget({ type: 'week', ref: `week-${week.week}`, label: `Week ${week.week}` })}
                    className="text-xs text-muted-foreground h-7 px-2"
                  >
                    <MessageCirclePlus className="w-3 h-3 mr-1" />
                    Feedback
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Week-level feedback form */}
              {feedbackTarget?.ref === `week-${week.week}` && sessionToken && (
                <SoftFeedbackForm
                  sessionToken={sessionToken}
                  targetType="week"
                  targetRef={`week-${week.week}`}
                  targetLabel={`Week ${week.week}`}
                  onSubmitted={(fb) => setFeedback(prev => [...prev, fb])}
                  onCancel={() => setFeedbackTarget(null)}
                />
              )}

              {week.tasks?.map((task, idx) => (
                <div key={idx}>
                  <div
                    className={`flex items-center gap-3 p-2 rounded-md ${
                      task.completed ? 'bg-muted/30' : 'bg-muted/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        task.completed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm flex-1 ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.duration && (
                      <span className="text-xs text-muted-foreground">{task.duration}</span>
                    )}
                    {role === 'commenter' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground/50 hover:text-primary"
                        onClick={() => setFeedbackTarget({ type: 'task', ref: `week-${week.week}-task-${idx}`, label: task.title })}
                      >
                        <MessageCirclePlus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {/* Task-level feedback form */}
                  {feedbackTarget?.ref === `week-${week.week}-task-${idx}` && sessionToken && (
                    <div className="mt-2 ml-8">
                      <SoftFeedbackForm
                        sessionToken={sessionToken}
                        targetType="task"
                        targetRef={`week-${week.week}-task-${idx}`}
                        targetLabel={task.title}
                        onSubmitted={(fb) => setFeedback(prev => [...prev, fb])}
                        onCancel={() => setFeedbackTarget(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {(!week.tasks || week.tasks.length === 0) && (
                <p className="text-sm text-muted-foreground">No tasks in this week</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Suggestion Form */}
        {role === 'commenter' && (
          <>
            {!showSuggestionForm ? (
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => setShowSuggestionForm(true)}
              >
                <Lightbulb className="w-4 h-4" />
                Suggest a Change
              </Button>
            ) : sessionToken && (
              <SoftSuggestionForm
                sessionToken={sessionToken}
                weeks={weeks}
                onSubmitted={(s) => setSuggestions(prev => [...prev, s])}
                onCancel={() => setShowSuggestionForm(false)}
              />
            )}
          </>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions ({suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map(s => (
                <div key={s.id} className="p-2 rounded-md bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'secondary' : 'outline'} className="text-[10px]">
                        {s.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{s.suggestion_type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {s.title && <p className="text-sm font-medium text-foreground">{s.title}</p>}
                  <p className="text-sm text-foreground/80">{s.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Comments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <CommentAttribution
                    authorName={comment.author_name}
                    isSoftAuthor={comment.is_soft_author}
                    softAuthorEmail={comment.soft_author_email}
                  />
                  {comment.target_ref && (
                    <Badge variant="outline" className="text-[10px]">{comment.target_ref}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{comment.content}</p>
              </div>
            ))}

            {role === 'commenter' && (
              <div className="flex gap-2 pt-2">
                <Textarea
                  placeholder="Leave a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={posting}
                  className="min-h-[60px]"
                />
                <Button
                  size="icon"
                  onClick={handlePostComment}
                  disabled={posting || !commentText.trim()}
                  className="shrink-0 self-end"
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Banner */}
        <SoftUpgradeBanner email={email} feedbackCount={feedback.length} />

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pb-8">
          External collaboration session. {getExpiryText() ? `Expires in ${getExpiryText()}.` : 'Session active.'}
        </p>
      </main>
    </div>
  );
};

export default SoftCollabReview;
