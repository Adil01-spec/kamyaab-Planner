/**
 * CloseDayButton (Phase 9.7)
 * 
 * User-initiated button to close the day with reflection.
 * Never required, always optional.
 */

import { Moon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CloseDayButtonProps {
  isClosed: boolean;
  isLoading?: boolean;
  onClick: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function CloseDayButton({
  isClosed,
  isLoading,
  onClick,
  variant = 'default',
  className,
}: CloseDayButtonProps) {
  if (isClosed) {
    // Show "Day closed" indicator
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          variant === 'compact' ? 'text-xs' : 'text-sm',
          className
        )}
      >
        <Check className={cn("text-primary", variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        <span>Day closed</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          "text-muted-foreground hover:text-foreground gap-1.5",
          className
        )}
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Close Day</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5",
        className
      )}
    >
      <Moon className="w-4 h-4 text-primary" />
      <span>Close Day</span>
    </Button>
  );
}
