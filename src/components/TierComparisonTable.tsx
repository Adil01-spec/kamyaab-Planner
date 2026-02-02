/**
 * Tier Comparison Table
 * 
 * Side-by-side comparison of all subscription tiers.
 * Shows features, pricing, and current tier indicator.
 */

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  TIER_DEFINITIONS, 
  TIER_HIERARCHY,
  formatPKRPrice,
  type ProductTier 
} from '@/lib/subscriptionTiers';

interface TierComparisonTableProps {
  /** User's current subscription tier */
  currentTier: ProductTier;
  /** Callback when user selects a tier (optional) */
  onSelectTier?: (tier: ProductTier) => void;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Displays all tiers side-by-side for comparison.
 * Highlights current tier and recommended tier (Pro).
 */
export function TierComparisonTable({
  currentTier,
  onSelectTier,
  compact = false,
  className,
}: TierComparisonTableProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile: Stack cards vertically */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIER_HIERARCHY.map((tierId) => {
          const tier = TIER_DEFINITIONS[tierId];
          const isCurrent = tierId === currentTier;
          const isHighlighted = tier.highlighted;
          
          return (
            <Card
              key={tierId}
              className={cn(
                'relative overflow-hidden transition-all',
                isCurrent && 'ring-2 ring-primary/50',
                isHighlighted && !isCurrent && 'border-primary/30 bg-primary/5'
              )}
            >
              {/* Current/Recommended badges */}
              {(isCurrent || isHighlighted) && (
                <div className="absolute top-0 right-0 left-0 flex justify-center -mt-0.5">
                  <Badge
                    className={cn(
                      'text-[10px] rounded-t-none',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/20 text-primary border-0'
                    )}
                  >
                    {isCurrent ? 'Current Plan' : 'Recommended'}
                  </Badge>
                </div>
              )}
              
              <CardContent className={cn('pt-6', (isCurrent || isHighlighted) && 'pt-8')}>
                {/* Tier name and tagline */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                </div>
                
                {/* Pricing */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {formatPKRPrice(tier.priceMonthlyPKR)}
                    </span>
                    {tier.priceMonthlyPKR !== null && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {tier.priceYearlyPKR !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatPKRPrice(tier.priceYearlyPKR)}/year
                    </p>
                  )}
                </div>
                
                {/* Features list */}
                {!compact && (
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Action button */}
                {onSelectTier && !isCurrent && (
                  <Button
                    variant={isHighlighted ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => onSelectTier(tierId)}
                  >
                    {tier.priceMonthlyPKR === null ? 'Get Started' : 'Upgrade'}
                  </Button>
                )}
                
                {isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    disabled
                  >
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        All features are fully functional. Upgrade only when you need more depth.
      </p>
    </div>
  );
}
