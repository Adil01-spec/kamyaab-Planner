import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Star, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SoftFeedbackFormProps {
  sessionToken: string;
  targetType: 'plan' | 'week' | 'task';
  targetRef?: string;
  targetLabel?: string;
  onSubmitted: (feedback: any) => void;
  onCancel: () => void;
}

const StarRating = ({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className="p-0.5 transition-colors"
        >
          <Star
            className={`w-4 h-4 ${star <= (value || 0) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
          />
        </button>
      ))}
    </div>
  </div>
);

const SoftFeedbackForm = ({ sessionToken, targetType, targetRef, targetLabel, onSubmitted, onCancel }: SoftFeedbackFormProps) => {
  const [content, setContent] = useState('');
  const [strategyScore, setStrategyScore] = useState<number | null>(null);
  const [feasibilityScore, setFeasibilityScore] = useState<number | null>(null);
  const [executionScore, setExecutionScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasContent = content.trim() || strategyScore || feasibilityScore || executionScore;

  const handleSubmit = async () => {
    if (!hasContent) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('soft-collab-feedback', {
        body: {
          session_token: sessionToken,
          target_type: targetType,
          target_ref: targetRef || null,
          content: content.trim() || null,
          strategy_score: strategyScore,
          feasibility_score: feasibilityScore,
          execution_score: executionScore,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to submit feedback');
        return;
      }

      setSubmitted(true);
      onSubmitted(data.feedback);
      toast.success('Feedback submitted');
      setTimeout(() => onCancel(), 1200);
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <CheckCircle2 className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">Feedback submitted</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-border bg-card space-y-3">
      {targetLabel && (
        <p className="text-xs text-muted-foreground font-medium">
          Feedback on: <span className="text-foreground">{targetLabel}</span>
        </p>
      )}

      <Textarea
        placeholder="Share your thoughts…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={submitting}
        className="min-h-[50px] text-sm"
      />

      <div className="flex flex-wrap gap-4">
        <StarRating label="Strategy" value={strategyScore} onChange={setStrategyScore} />
        <StarRating label="Feasibility" value={feasibilityScore} onChange={setFeasibilityScore} />
        <StarRating label="Execution" value={executionScore} onChange={setExecutionScore} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !hasContent}>
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          <span className="ml-1">Submit</span>
        </Button>
      </div>
    </div>
  );
};

export default SoftFeedbackForm;
