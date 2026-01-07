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

interface SecondaryTaskCardProps {
  task: Task;
  weekNumber: number;
  weekFocus: string;
  onComplete: () => void;
  isCompleting?: boolean;
  taskNumber: number;
  isScheduled?: boolean;
  fallbackExplanation?: string;
}

// Convert hours to friendly time hint
const getTimeHint = (hours: number): string => {
  if (hours <= 0.5) return '~30 min';
  if (hours <= 1) return '~1 hour';
  if (hours <= 2) return 'Deep focus';
  return `~${hours}h`;
};

// Format explanation "how" into bullet points
const formatHowToBullets = (how: string): string[] => {
  if (!how) return [];
  const lines = how
    .split(/(?:\n|(?<=\.)\s+(?=[A-Z])|(?:^\d+\.\s*))/gm)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 100);
  return lines.slice(0, 3);
};

export function SecondaryTaskCard({ 
  task, 
  weekNumber, 
  weekFocus,
  onComplete,
  isCompleting = false,
  taskNumber,
  isScheduled = false,
  fallbackExplanation
}: SecondaryTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExplanation = task.explanation && (task.explanation.how || task.explanation.why);
  const hasFallback = !hasExplanation && fallbackExplanation;
  const showHowSection = hasExplanation || hasFallback;
  const howBullets = formatHowToBullets(task.explanation?.how || '');

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-200",
        "bg-card/60 border border-border/30",
        task.completed && "opacity-50"
      )}
    >
      {/* Main Content - Compact */}
      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {/* Task number indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Up next #{taskNumber}</span>
              <span className="text-xs text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeHint(task.estimated_hours)}
              </span>
              {isScheduled && (
                <span className="flex items-center gap-1 text-xs text-primary/70">
                  <CalendarCheck className="w-3 h-3" />
                </span>
              )}
            </div>
            
            {/* Task Title */}
            <h3 className={cn(
              "text-base font-medium text-foreground leading-snug",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
          </div>

          {/* Complete button - small */}
          <AnimatePresence mode="wait">
            {!task.completed ? (
              <motion.div
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={onComplete}
                  disabled={isCompleting}
                  size="sm"
                  variant="outline"
                  className="touch-press h-9 px-3 shrink-0"
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-primary text-sm"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expandable Section - Compact */}
      {showHowSection && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs",
                "border-t border-border/10 bg-muted/20 hover:bg-muted/40 transition-colors",
                "text-muted-foreground"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                How to approach
              </span>
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 sm:px-5 py-3 space-y-3 border-t border-border/5 bg-muted/10"
            >
              {howBullets.length > 0 && (
                <ul className="space-y-1.5">
                  {howBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground/70">
                      <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Fallback explanation when no AI explanation exists */}
              {hasFallback && (
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {fallbackExplanation}
                </p>
              )}

              {task.explanation?.why && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/5">
                  <Lightbulb className="w-3 h-3 text-amber-500/70 shrink-0 mt-0.5" />
                  <p className="leading-relaxed line-clamp-2">{task.explanation.why}</p>
                </div>
              )}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}
