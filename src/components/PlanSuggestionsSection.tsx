import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, Check, X, PenLine, Plus, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

interface PlanSuggestionsSectionProps {
  planId: string;
}

const typeConfig: Record<string, { label: string; icon: any }> = {
  edit_task: { label: 'Edit Task', icon: PenLine },
  new_task: { label: 'New Task', icon: Plus },
  adjust_deadline: { label: 'Adjust Timeline', icon: CalendarClock },
};

const PlanSuggestionsSection = ({ planId }: PlanSuggestionsSectionProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('plan_suggestions')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSuggestions(data as Suggestion[]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('plan_suggestions')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        toast.error('Failed to update suggestion');
        return;
      }

      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status, resolved_at: new Date().toISOString() } : s));
      toast.success(`Suggestion ${status}`);
    } catch {
      toast.error('Failed to update suggestion');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return null;
  if (suggestions.length === 0) return null;

  const pending = suggestions.filter(s => s.status === 'pending');
  const resolved = suggestions.filter(s => s.status !== 'pending');

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          External Suggestions
          {pending.length > 0 && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              {pending.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map(s => {
          const config = typeConfig[s.suggestion_type] || { label: s.suggestion_type, icon: Lightbulb };
          const Icon = config.icon;
          return (
            <div key={s.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <Badge variant="outline" className="text-xs">{config.label}</Badge>
                  {s.target_ref && <span className="text-xs text-muted-foreground">{s.target_ref}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                </span>
              </div>
              {s.title && <p className="text-sm font-medium text-foreground">{s.title}</p>}
              <p className="text-sm text-foreground/80">{s.description}</p>
              <p className="text-xs text-muted-foreground">From: {s.email}</p>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdate(s.id, 'approved')}
                  disabled={updatingId === s.id}
                  className="text-primary border-primary/30"
                >
                  {updatingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span className="ml-1">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdate(s.id, 'rejected')}
                  disabled={updatingId === s.id}
                  className="text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                  <span className="ml-1">Reject</span>
                </Button>
              </div>
            </div>
          );
        })}

        {resolved.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Resolved</p>
            {resolved.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-muted/10">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={s.status === 'approved' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {s.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {s.title || s.description.slice(0, 50)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{s.email}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanSuggestionsSection;
