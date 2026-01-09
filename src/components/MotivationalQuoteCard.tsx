import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDailyQuote, isQuoteDismissedToday, dismissQuoteForToday, UserState } from '@/lib/motivationalQuotes';

interface MotivationalQuoteCardProps {
  userState: UserState;
  className?: string;
}

export const MotivationalQuoteCard = ({ 
  userState,
  className 
}: MotivationalQuoteCardProps) => {
  const [isDismissed, setIsDismissed] = useState(true);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Check if already dismissed today
    const dismissed = isQuoteDismissedToday();
    setIsDismissed(dismissed);
    
    if (!dismissed) {
      setQuote(getDailyQuote(userState));
    }
  }, [userState]);

  const handleDismiss = () => {
    dismissQuoteForToday();
    setIsDismissed(true);
  };

  if (isDismissed || !quote) return null;

  return (
    <div
      className={cn(
        "relative rounded-xl p-4 transition-all animate-fade-in",
        "bg-card/50 border border-border/30",
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Subtle accent line */}
      <div 
        className="absolute inset-x-4 top-0 h-px rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)'
        }}
      />
      
      <div className="flex items-start gap-3">
        {/* Quote icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary/50" />
        </div>
        
        {/* Quote text */}
        <p className="flex-1 text-sm text-foreground/70 italic leading-relaxed">
          {quote}
        </p>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="Dismiss for today"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
