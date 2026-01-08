import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Check, 
  ChevronDown, 
  Clock, 
  Target,
  Lightbulb,
  Loader2,
  CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskExplanation {
  how: string;
  why: string;
  expected_outcome: string;
}

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  explanation?: TaskExplanation;
}

interface TodayTaskCardProps {
  task: Task;
  weekNumber: number;
  weekFocus: string;
  onComplete: () => void;
  isCompleting?: boolean;
  isPrimary?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
  showExpandable?: boolean;
  fallbackExplanation?: string;
}

// Convert hours to friendly time hint
const getTimeHint = (hours: number): string => {
  if (hours <= 0.5) return '~30 min';
  if (hours <= 1) return '~1 hour';
  if (hours <= 2) return 'Deep focus';
  return `~${hours}h session`;
};

// Format explanation "how" into bullet points
const formatHowToBullets = (how: string): string[] => {
  if (!how) return [];
  const lines = how
    .split(/(?:\n|(?<=\.)\s+(?=[A-Z])|(?:^\d+\.\s*))/gm)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 100);
  return lines.slice(0, 4);
};

export function TodayTaskCard({ 
  task, 
  weekNumber, 
  weekFocus,
  onComplete,
  isCompleting = false,
  isPrimary = false,
  onSelect,
  isSelected = false,
  showExpandable = true,
  fallbackExplanation
}: TodayTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExplanation = task.explanation && (task.explanation.how || task.explanation.why);
  const hasFallback = !hasExplanation && fallbackExplanation;
  const showHowSection = showExpandable && (hasExplanation || hasFallback);
  const howBullets = formatHowToBullets(task.explanation?.how || '');

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <motion.div
      layout
      onClick={handleCardClick}
      onMouseEnter={onSelect}
      className={cn(
        "rounded-2xl glass-card border overflow-hidden transition-all duration-200",
        isPrimary 
          ? "border-primary/30 shadow-lg shadow-primary/5" 
          : "border-border/30",
        isSelected && "ring-2 ring-primary/40 border-primary/40",
        task.completed && "opacity-60",
        onSelect && !task.completed && "cursor-pointer hover:border-primary/40"
      )}
    >
      {/* Accent bar for primary */}
      {isPrimary && <div className="h-1 gradient-kaamyab" />}
      
      {/* Main Task Content */}
      <div className={cn("p-5", isPrimary && "p-6")}>
        {/* Primary label */}
        {isPrimary && !task.completed && (
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            Start with this
          </p>
        )}
        
        {/* Week indicator + Time hint */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>Week {weekNumber}</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">{weekFocus}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-primary/70">
              <CalendarCheck className="w-3 h-3" />
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {getTimeHint(task.estimated_hours)}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className={cn(
          "font-semibold text-foreground mb-4 leading-tight",
          isPrimary ? "text-xl" : "text-lg",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h3>

        {/* Complete Button */}
        <AnimatePresence mode="wait">
          {!task.completed ? (
            <motion.div
              key="complete-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                disabled={isCompleting}
                size={isPrimary ? "lg" : "default"}
                className={cn(
                  "w-full touch-press font-medium",
                  isPrimary 
                    ? "gradient-kaamyab hover:opacity-90 h-12 text-base" 
                    : "h-10"
                )}
              >
                {isCompleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {isPrimary ? 'Start this task' : 'Complete'}
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-3 text-primary"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Completed</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable "How to approach this" Section - only on mobile */}
      {showHowSection && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3 text-sm",
                "border-t border-border/20 bg-muted/30 hover:bg-muted/50 transition-colors",
                "text-foreground/80 font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                How to approach this
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-4 space-y-4 border-t border-border/10 bg-muted/20"
            >
              {/* Bullet steps */}
              {howBullets.length > 0 && (
                <ul className="space-y-2">
                  {howBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Fallback explanation */}
              {hasFallback && (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {fallbackExplanation}
                </p>
              )}

              {/* Why this matters */}
              {task.explanation?.why && (
                <div className="flex items-start gap-2 pt-3 border-t border-border/10">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.explanation.why}
                  </p>
                </div>
              )}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}