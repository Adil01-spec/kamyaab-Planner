import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { cn } from '@/lib/utils';

interface ProFeatureHintProps {
  /** Feature ID from FEATURE_REGISTRY */
  featureId: string;
  /** Current plan data */
  planData?: { is_strategic_plan?: boolean } | null;
  /** Hint text to display */
  children: string;
  /** When to show the hint */
  showWhen?: 'always' | 'free-only' | 'never';
  /** Custom class name */
  className?: string;
}

/**
 * Subtle inline text hint for Pro features
 * 
 * Shows a gentle, non-intrusive message about Pro features.
 * Never blocks or interrupts - just informs.
 */
export function ProFeatureHint({
  featureId,
  planData,
  children,
  showWhen = 'free-only',
  className,
}: ProFeatureHintProps) {
  const { hasAccess, isPro, trackInterest } = useFeatureAccess(featureId, planData);
  
  // Don't show if not a Pro feature
  if (!isPro) return null;
  
  // Determine visibility
  if (showWhen === 'never') return null;
  if (showWhen === 'free-only' && hasAccess) return null;
  
  // Track that user viewed this hint
  const handleView = () => {
    if (!hasAccess) {
      trackInterest('viewed');
    }
  };
  
  return (
    <p 
      className={cn(
        'text-xs text-muted-foreground/70 italic',
        className
      )}
      onMouseEnter={handleView}
    >
      {children}
    </p>
  );
}
