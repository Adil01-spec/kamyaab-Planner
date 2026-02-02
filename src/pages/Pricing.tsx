/**
 * Pricing Page
 * 
 * Shows subscription tier comparison for users to understand
 * what features are available at each level.
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TierComparisonTable } from '@/components/TierComparisonTable';
import { useSubscription } from '@/hooks/useSubscription';
import { DynamicBackground } from '@/components/DynamicBackground';

export default function Pricing() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const currentTier = tier || 'standard';

  return (
    <div className="min-h-screen relative">
      <DynamicBackground enabled />
      
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Plans & Features</h1>
            <p className="text-sm text-muted-foreground">
              See what's available at each tier
            </p>
          </div>
        </div>

        {/* Intro text */}
        <div className="mb-8 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50">
          <p className="text-sm text-foreground/80 leading-relaxed">
            All core features are free. Paid tiers add depth—more history, strategic tools, 
            and professional exports. Nothing degrades over time. Upgrade when you need more.
          </p>
        </div>

        {/* Tier Comparison */}
        <TierComparisonTable 
          currentTier={currentTier}
          className="mb-8"
        />

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/60 text-center">
          Have questions? Reach out anytime—we're here to help.
        </p>
      </div>
    </div>
  );
}
