import { Star, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { cn } from '@/lib/utils';

interface ProFeatureIndicatorProps {
  /** Feature ID from FEATURE_REGISTRY */
  featureId: string;
  /** Current plan data */
  planData?: { is_strategic_plan?: boolean } | null;
  /** Visual variant */
  variant?: 'lock' | 'star' | 'badge';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
  /** Only show when user doesn't have access */
  showOnlyWhenLocked?: boolean;
}

/**
 * Subtle indicator for Pro features
 * 
 * Displays a small lock, star, or badge to indicate Pro features.
 * Never blocks access - purely visual awareness.
 */
export function ProFeatureIndicator({
  featureId,
  planData,
  variant = 'badge',
  showTooltip = true,
  className,
  showOnlyWhenLocked = false,
}: ProFeatureIndicatorProps) {
  const { hasAccess, isPro, featureName } = useFeatureAccess(featureId, planData);
  
  // Don't show if not a Pro feature
  if (!isPro) return null;
  
  // Don't show if user has access and we only want to show when locked
  if (hasAccess && showOnlyWhenLocked) return null;
  
  const content = (
    <>
      {variant === 'lock' && (
        <Lock className={cn(
          'w-3.5 h-3.5 text-muted-foreground/60',
          !hasAccess && 'text-primary/60',
          className
        )} />
      )}
      {variant === 'star' && (
        <Star className={cn(
          'w-3.5 h-3.5',
          hasAccess ? 'text-primary fill-primary/20' : 'text-muted-foreground/60',
          className
        )} />
      )}
      {variant === 'badge' && (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] h-4 px-1.5 font-medium border-primary/20',
            hasAccess 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted/50 text-muted-foreground',
            className
          )}
        >
          {hasAccess ? 'Strategic' : 'Pro'}
        </Badge>
      )}
    </>
  );
  
  if (!showTooltip) return content;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">{content}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {hasAccess 
            ? `${featureName || 'This feature'} is part of Strategic Planning`
            : `Available with Strategic Planning`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
