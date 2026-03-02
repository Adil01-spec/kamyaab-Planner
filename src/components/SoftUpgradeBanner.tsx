import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SoftUpgradeBannerProps {
  email: string;
  feedbackCount: number;
}

const VISIT_KEY = 'soft_collab_visits';

const SoftUpgradeBanner = ({ email, feedbackCount }: SoftUpgradeBannerProps) => {
  const [visits, setVisits] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const current = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
    const next = current + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    setVisits(next);
  }, []);

  // Show if 2+ feedback or 3+ visits
  const shouldShow = !dismissed && (feedbackCount >= 2 || visits >= 3);

  if (!shouldShow) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="py-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Sparkles className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Unlock Full Collaboration</p>
            <p className="text-xs text-muted-foreground">Create a free account to collaborate across plans and get notified of updates.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              window.location.href = `/auth?mode=signup&upgrade_from_soft=true&email=${encodeURIComponent(email)}`;
            }}
          >
            Sign Up Free
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-xs text-muted-foreground">
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoftUpgradeBanner;
