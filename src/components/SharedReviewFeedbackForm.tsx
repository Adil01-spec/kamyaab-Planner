import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SharedReviewFeedbackFormProps {
  sharedReviewId: string;
}

const CHALLENGE_AREAS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'scope', label: 'Scope' },
  { id: 'resources', label: 'Resources' },
  { id: 'priorities', label: 'Priorities' },
];

const STORAGE_KEY_PREFIX = 'kaamyab_feedback_submitted_';

/**
 * Structured feedback form for shared review viewers
 * - Multiple choice + optional short text
 * - One submission per session (tracked via localStorage)
 */
export function SharedReviewFeedbackForm({ sharedReviewId }: SharedReviewFeedbackFormProps) {
  const [feelsRealistic, setFeelsRealistic] = useState<'yes' | 'somewhat' | 'no' | null>(null);
  const [challengeAreas, setChallengeAreas] = useState<string[]>([]);
  const [unclearOrRisky, setUnclearOrRisky] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if already submitted
  useEffect(() => {
    const storageKey = STORAGE_KEY_PREFIX + sharedReviewId;
    const alreadySubmitted = localStorage.getItem(storageKey);
    if (alreadySubmitted) {
      setSubmitted(true);
    }
  }, [sharedReviewId]);

  const toggleChallengeArea = (areaId: string) => {
    setChallengeAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((a) => a !== areaId)
        : [...prev, areaId]
    );
  };

  const handleSubmit = async () => {
    if (!feelsRealistic) {
      toast({
        title: 'Please answer the first question',
        description: 'Select whether this plan feels realistic.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('review_feedback').insert({
        shared_review_id: sharedReviewId,
        feels_realistic: feelsRealistic,
        challenge_areas: challengeAreas.length > 0 ? challengeAreas : null,
        unclear_or_risky: unclearOrRisky.trim() || null,
      });

      if (error) throw error;

      // Mark as submitted
      const storageKey = STORAGE_KEY_PREFIX + sharedReviewId;
      localStorage.setItem(storageKey, 'true');
      setSubmitted(true);

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted.',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mt-8">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Feedback Submitted</h3>
          <p className="text-muted-foreground text-sm">
            Thank you for sharing your perspective. The plan owner will review your input.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Share Your Perspective</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Help improve this plan with quick, structured feedback.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question 1: Realism */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Does this plan feel realistic?
          </Label>
          <RadioGroup
            value={feelsRealistic || ''}
            onValueChange={(v) => setFeelsRealistic(v as 'yes' | 'somewhat' | 'no')}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="realistic-yes" />
              <Label htmlFor="realistic-yes" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somewhat" id="realistic-somewhat" />
              <Label htmlFor="realistic-somewhat" className="font-normal cursor-pointer">
                Somewhat
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="realistic-no" />
              <Label htmlFor="realistic-no" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question 2: Challenge Areas */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            What would you challenge? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {CHALLENGE_AREAS.map((area) => (
              <Badge
                key={area.id}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors px-3 py-1.5',
                  challengeAreas.includes(area.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                )}
                onClick={() => toggleChallengeArea(area.id)}
              >
                {area.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Question 3: Unclear/Risky */}
        <div className="space-y-3">
          <Label htmlFor="unclear" className="text-base font-medium">
            What feels unclear or risky? <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="unclear"
            placeholder="Brief observations or concerns..."
            value={unclearOrRisky}
            onChange={(e) => setUnclearOrRisky(e.target.value.slice(0, 500))}
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">
            {unclearOrRisky.length}/500
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !feelsRealistic}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
