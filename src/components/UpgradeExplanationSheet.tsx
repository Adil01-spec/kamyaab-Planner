/**
 * Upgrade Explanation Sheet
 * 
 * Calm, informational bottom sheet explaining a locked feature's value.
 * No urgency, no pressure - just facts and a single optional CTA.
 */

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { getFeatureDefinition } from '@/lib/productTiers';
import { 
  getTierDefinition, 
  formatPKRPrice,
  type ProductTier 
} from '@/lib/subscriptionTiers';
import { useNavigate } from 'react-router-dom';

interface UpgradeExplanationSheetProps {
  /** Feature ID from FEATURE_REGISTRY */
  featureId: string;
  /** Whether sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet that explains a feature's value and upgrade path.
 * Designed to inform, not pressure.
 */
export function UpgradeExplanationSheet({
  featureId,
  open,
  onOpenChange,
}: UpgradeExplanationSheetProps) {
  const navigate = useNavigate();
  const feature = getFeatureDefinition(featureId);
  
  if (!feature) return null;
  
  const tier = getTierDefinition(feature.tier as ProductTier);
  
  const handleViewPlans = () => {
    onOpenChange(false);
    // For now, navigate to settings - future: dedicated pricing page
    navigate('/');
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <DrawerTitle className="text-lg">{feature.name}</DrawerTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 font-medium border-primary/20 bg-primary/5 text-primary"
                >
                  {tier.name}
                </Badge>
              </div>
              <DrawerDescription className="text-sm text-muted-foreground">
                {feature.valueExplanation || feature.description}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        
        {/* Pricing info */}
        <div className="px-4 pb-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-foreground/80 mb-2">
              Available with <span className="font-medium">{tier.name}</span>
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">
                {formatPKRPrice(tier.priceMonthlyPKR)}
              </span>
              {tier.priceMonthlyPKR !== null && (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>
            {tier.priceYearlyPKR !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                or {formatPKRPrice(tier.priceYearlyPKR)}/year (save 33%)
              </p>
            )}
          </div>
          
          {/* What's included */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Includes:</p>
            <ul className="space-y-1.5">
              {tier.features.slice(0, 4).map((f, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <DrawerFooter className="pt-2">
          <Button
            variant="outline"
            onClick={handleViewPlans}
            className="w-full"
          >
            View Plans
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Maybe later
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
