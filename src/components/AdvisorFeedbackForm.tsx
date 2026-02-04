import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvisorFeedbackFormProps {
  sharedReviewId: string;
}

const CHALLENGE_OPTIONS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'scope', label: 'Scope' },
  { id: 'resources', label: 'Resources' },
  { id: 'priorities', label: 'Priorities' },
];

const REALISM_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'no', label: 'No' },
];

export function AdvisorFeedbackForm({ sharedReviewId }: AdvisorFeedbackFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [feelsRealistic, setFeelsRealistic] = useState<string | null>(null);
  const [challengeAreas, setChallengeAreas] = useState<string[]>([]);
  const [unclearOrRisky, setUnclearOrRisky] = useState('');
  const [advisorObservation, setAdvisorObservation] = useState('');

  // Check localStorage for previous submission
  useEffect(() => {
    const submitted = localStorage.getItem(`advisor-feedback-${sharedReviewId}`);
    if (submitted) {
      setHasSubmitted(true);
    }
  }, [sharedReviewId]);

  const handleChallengeToggle = (id: string) => {
    setChallengeAreas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!feelsRealistic) {
      toast({
        title: 'Please answer the realism question',
        description: 'This helps the plan owner understand your perspective.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('review_feedback').insert({
        shared_review_id: sharedReviewId,
        feels_realistic: feelsRealistic,
        challenge_areas: challengeAreas.length > 0 ? challengeAreas : null,
        unclear_or_risky: unclearOrRisky.trim() || null,
        advisor_observation: advisorObservation.trim() || null,
      });

      if (error) throw error;

      // Mark as submitted in localStorage
      localStorage.setItem(`advisor-feedback-${sharedReviewId}`, 'true');
      setHasSubmitted(true);

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for sharing your professional perspective.',
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already submitted state
  if (hasSubmitted) {
    return (
      <Card className="mt-8 border-muted bg-muted/30 print:hidden">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">
            Your feedback has been submitted. Thank you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 border-muted print:hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          Advisor Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your professional perspective on this plan.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Realism Question */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Does this plan feel realistic?
          </Label>
          <div className="flex gap-2">
            {REALISM_OPTIONS.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={feelsRealistic === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeelsRealistic(option.value)}
                className="flex-1"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Challenge Areas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            What would you challenge? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {CHALLENGE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChallengeToggle(option.id)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  challengeAreas.includes(option.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unclear or Risky */}
        <div className="space-y-2">
          <Label htmlFor="unclear" className="text-sm font-medium">
            What feels unclear or risky? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="unclear"
            placeholder="Brief observations..."
            value={unclearOrRisky}
            onChange={e => setUnclearOrRisky(e.target.value.slice(0, 500))}
            className="resize-none min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground text-right">
            {unclearOrRisky.length}/500
          </p>
        </div>

        {/* Strategic Observation - Advisor specific */}
        <div className="space-y-2">
          <Label htmlFor="observation" className="text-sm font-medium">
            Strategic observation <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="observation"
            placeholder="Share deeper insights or recommendations..."
            value={advisorObservation}
            onChange={e => setAdvisorObservation(e.target.value.slice(0, 500))}
            className="resize-none min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground text-right">
            {advisorObservation.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !feelsRealistic}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
