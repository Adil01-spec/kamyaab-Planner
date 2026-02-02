/**
 * Locked Feature Card
 * 
 * Displays locked premium features with optional preview content.
 * Shows feature value explanation and tier requirement without pressure.
 */

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getFeatureDefinition } from '@/lib/productTiers';
import { getTierDisplayName } from '@/lib/subscriptionTiers';
import { UpgradeExplanationSheet } from './UpgradeExplanationSheet';

interface LockedFeatureCardProps {
  /** Feature ID from FEATURE_REGISTRY */
  featureId: string;
  /** Preview content to show in locked state (optional) */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to show collapsed preview */
  showPreview?: boolean;
}

/**
 * Card component for displaying locked premium features.
 * Never blocks workflow - purely informational.
 */
export function LockedFeatureCard({
  featureId,
  children,
  className,
  showPreview = true,
}: LockedFeatureCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const feature = getFeatureDefinition(featureId);
  
  if (!feature) return null;
  
  const tierName = getTierDisplayName(feature.tier);
  
  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden border-border/40 bg-muted/20 cursor-pointer transition-colors hover:bg-muted/30',
          className
        )}
        onClick={() => setSheetOpen(true)}
      >
        {/* Lock indicator in corner */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 font-medium border-muted-foreground/20 bg-muted/50 text-muted-foreground"
          >
            {tierName}
          </Badge>
        </div>
        
        <CardContent className="pt-5 pb-4">
          {/* Feature name and explanation */}
          <div className="pr-20">
            <h4 className="text-sm font-medium text-foreground/80 mb-1">
              {feature.name}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.valueExplanation || feature.description}
            </p>
          </div>
          
          {/* Optional preview content (blurred/faded) */}
          {showPreview && children && (
            <div className="mt-4 relative">
              <div className="opacity-40 pointer-events-none select-none blur-[1px]">
                {children}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/80" />
            </div>
          )}
          
          {/* Tap hint */}
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Tap to learn more
          </p>
        </CardContent>
      </Card>
      
      {/* Upgrade explanation sheet */}
      <UpgradeExplanationSheet
        featureId={featureId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
