import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Play, 
  ChevronDown, 
  Clock, 
  Target,
  Lightbulb,
  Check,
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

interface PrimaryTaskCardProps {
  task: Task;
  weekNumber: number;
  weekFocus: string;
  onComplete: () => void;
  isCompleting?: boolean;
  isScheduled?: boolean;
  fallbackExplanation?: string;
  onStartTask?: () => void;
  executionStatus?: 'idle' | 'doing' | 'done';
  elapsedSeconds?: number;
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
  
  // Split by newlines, periods, or numbered items
  const lines = how
    .split(/(?:\n|(?<=\.)\s+(?=[A-Z])|(?:^\d+\.\s*))/gm)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 100);
  
  // Take first 4 actionable items
  return lines.slice(0, 4);
};

export function PrimaryTaskCard({ 
  task, 
  weekNumber, 
  weekFocus,
  onComplete,
  isCompleting = false,
  isScheduled = false,
  fallbackExplanation,
  onStartTask,
  executionStatus = 'idle',
  elapsedSeconds = 0,
}: PrimaryTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExplanation = task.explanation && (task.explanation.how || task.explanation.why);
  const hasFallback = !hasExplanation && fallbackExplanation;
  const showHowSection = hasExplanation || hasFallback;
  const howBullets = formatHowToBullets(task.explanation?.how || '');
  const isActive = executionStatus === 'doing';
  const isDone = executionStatus === 'done' || task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-3xl overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-card via-card to-card/80",
        "border-2 border-primary/20 shadow-lg shadow-primary/5",
        isDone && "opacity-60 border-border/30",
        isActive && "ring-2 ring-primary/50 border-primary/40"
      )}
    >
      {/* Accent top bar */}
      <div className={cn("h-1", isActive ? "bg-primary animate-pulse" : "gradient-kaamyab")} />

      {/* Main Content */}
      <div className="p-6 sm:p-8">
        {/* Header with context */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Week {weekNumber}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">{weekFocus}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Calendar scheduled indicator */}
            {isScheduled && (
              <div className="flex items-center gap-1 text-xs text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">
                <CalendarCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Scheduled</span>
              </div>
            )}
            
            {/* Time hint */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>{getTimeHint(task.estimated_hours)}</span>
            </div>
          </div>
        </div>

        {/* Primary label */}
        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
          Start with this
        </p>

        {/* Task Title - Large and prominent */}
        <h2 className={cn(
          "text-xl sm:text-2xl font-bold text-foreground mb-4 leading-tight",
          isDone && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h2>

        {/* Active Timer Display */}
        {isActive && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-lg font-bold text-primary font-mono">
              {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
              {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-sm text-primary/70">In progress</span>
          </div>
        )}

        {/* Primary Action Button */}
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 py-4 text-primary bg-primary/5 rounded-xl"
            >
              <Check className="w-5 h-5" />
              <span className="font-semibold">Completed</span>
            </motion.div>
          ) : isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-3 text-sm text-muted-foreground"
            >
              Use the timer below to mark as complete
            </motion.div>
          ) : (
            <motion.div
              key="action"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                onClick={onStartTask}
                disabled={isCompleting}
                size="lg"
                className="w-full gradient-kaamyab hover:opacity-90 touch-press h-14 text-base font-semibold rounded-xl"
              >
                {isCompleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Start this task
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable "How to approach this" Section */}
      {showHowSection && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-between px-6 sm:px-8 py-4 text-sm",
                "border-t border-border/20 bg-muted/20 hover:bg-muted/40 transition-colors",
                "text-foreground/80 font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                How to approach this
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200 text-muted-foreground",
                isExpanded && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 sm:px-8 py-5 space-y-4 border-t border-border/10 bg-muted/10"
            >
              {/* Bullet steps - actionable format (from AI explanation) */}
              {howBullets.length > 0 && (
                <ul className="space-y-2.5">
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

              {/* Fallback explanation when no AI explanation exists */}
              {hasFallback && (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {fallbackExplanation}
                </p>
              )}

              {/* Why this matters */}
              {task.explanation?.why && (
                <div className="pt-3 border-t border-border/10">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {task.explanation.why}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}
