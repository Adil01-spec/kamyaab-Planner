import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Lightbulb, PenLine, CalendarClock, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PlanWeek {
  week: number;
  tasks: { title: string }[];
}

interface SoftSuggestionFormProps {
  sessionToken: string;
  weeks: PlanWeek[];
  onSubmitted: (suggestion: any) => void;
  onCancel: () => void;
}

const TYPES = [
  { value: 'edit_task', label: 'Edit Task', icon: PenLine },
  { value: 'new_task', label: 'New Task', icon: Plus },
  { value: 'adjust_deadline', label: 'Adjust Timeline', icon: CalendarClock },
] as const;

const SoftSuggestionForm = ({ sessionToken, weeks, onSubmitted, onCancel }: SoftSuggestionFormProps) => {
  const [type, setType] = useState<string>('edit_task');
  const [targetRef, setTargetRef] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('soft-collab-suggest', {
        body: {
          session_token: sessionToken,
          suggestion_type: type,
          target_ref: targetRef || null,
          title: title.trim() || null,
          description: description.trim(),
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to submit suggestion');
        return;
      }

      onSubmitted(data.suggestion);
      toast.success('Suggestion submitted');
      setDescription('');
      setTitle('');
      setTargetRef('');
      onCancel();
    } catch {
      toast.error('Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  // Build task references for selection
  const taskRefs = weeks.flatMap(w =>
    (w.tasks || []).map((t, i) => ({
      ref: `week-${w.week}-task-${i}`,
      label: `Week ${w.week}: ${t.title}`,
    }))
  );

  return (
    <div className="p-4 rounded-lg border border-border bg-card space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Suggest a Change</span>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                type === t.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Target task (for edit/deadline) */}
      {(type === 'edit_task' || type === 'adjust_deadline') && taskRefs.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Which task?</Label>
          <select
            value={targetRef}
            onChange={e => setTargetRef(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a task…</option>
            {taskRefs.map(t => (
              <option key={t.ref} value={t.ref}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* New task title */}
      {type === 'new_task' && (
        <div className="space-y-1">
          <Label className="text-xs">Task title</Label>
          <Input
            placeholder="Suggested task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={submitting}
            className="h-9 text-sm"
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-xs">
          {type === 'edit_task' ? 'What should change?' : type === 'new_task' ? 'Why add this task?' : 'Suggested adjustment'}
        </Label>
        <Textarea
          placeholder="Describe your suggestion…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={submitting}
          className="min-h-[60px] text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !description.trim()}>
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          <span className="ml-1">Submit</span>
        </Button>
      </div>
    </div>
  );
};

export default SoftSuggestionForm;
