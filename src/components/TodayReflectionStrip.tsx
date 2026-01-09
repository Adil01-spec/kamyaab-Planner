import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SignalState } from '@/lib/dailyContextEngine';

const REFLECTION_STORAGE_KEY = 'kaamyab_reflection';

// Phase 7.3: Signal-adaptive reflection prompts
const reflectionPromptsBySignal: Record<SignalState, string[]> = {
  'momentum': [
    "What's working for you lately?",
    "What helped maintain your rhythm?",
    "What pattern is serving you well?",
    "What made this week feel different?",
  ],
  'neutral': [
    "One small win today?",
    "What helped you show up today?",
    "One thing that made today easier?",
    "What would future-you thank you for?",
  ],
  'burnout-risk': [
    "What would make today easier?",
    "What's one thing you can let go of?",
    "What would feel like rest right now?",
    "What do you need most today?",
  ],
};

// Get today's prompt based on day of year and signal state
const getTodayPrompt = (signalState: SignalState): string => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const prompts = reflectionPromptsBySignal[signalState];
  return prompts[dayOfYear % prompts.length];
};

// Get today's date string
const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0];
};

interface TodayReflectionStripProps {
  className?: string;
  signalState?: SignalState;
}

export function TodayReflectionStrip({ className, signalState = 'neutral' }: TodayReflectionStripProps) {
  const [reflection, setReflection] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const todayPrompt = useMemo(() => getTodayPrompt(signalState), [signalState]);
  const todayKey = getTodayKey();
  
  // Load saved reflection on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REFLECTION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayKey) {
          setReflection(parsed.text || '');
          setIsSubmitted(!!parsed.text);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [todayKey]);
  
  const handleSubmit = () => {
    if (reflection.trim()) {
      try {
        localStorage.setItem(REFLECTION_STORAGE_KEY, JSON.stringify({
          date: todayKey,
          text: reflection.trim(),
        }));
        setIsSubmitted(true);
      } catch {
        // Ignore storage errors
      }
    }
  };
  
  const handleSkip = () => {
    setIsDismissed(true);
  };
  
  if (isDismissed) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        "rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Quick reflection
          </p>
          
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-foreground/80"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>"{reflection}"</span>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-3">
                {todayPrompt}
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value.slice(0, 140))}
                  placeholder="Type a quick thought..."
                  maxLength={140}
                  className={cn(
                    "flex-1 min-w-0 bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && reflection.trim()) {
                      handleSubmit();
                    }
                  }}
                />
                
                {reflection.trim() && (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    className="shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground/50 mt-1.5">
                {reflection.length}/140 • Press Enter to save
              </p>
            </>
          )}
        </div>
        
        {!isSubmitted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-8 w-8 shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
