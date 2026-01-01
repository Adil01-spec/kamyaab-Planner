import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Check, 
  ChevronDown, 
  Clock, 
  Lightbulb,
  Target,
  AlertCircle,
  Loader2
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
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Low':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function TodayTaskCard({ 
  task, 
  weekNumber, 
  weekFocus,
  onComplete,
  isCompleting = false
}: TodayTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExplanation = task.explanation && (task.explanation.how || task.explanation.why);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl glass-card border border-border/30 overflow-hidden transition-all duration-200",
        task.completed && "opacity-60"
      )}
    >
      {/* Main Task Content */}
      <div className="p-5">
        {/* Week indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground/70">Week {weekNumber}</span>
          <span className="text-xs text-muted-foreground/40">•</span>
          <span className="text-xs text-muted-foreground/70 truncate">{weekFocus}</span>
        </div>

        {/* Task Title */}
        <h3 className={cn(
          "text-lg font-semibold text-foreground mb-3 leading-tight",
          task.completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getPriorityColor(task.priority))}
          >
            {task.priority}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {task.estimated_hours}h estimated
          </span>
        </div>

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
                onClick={onComplete}
                disabled={isCompleting}
                className="w-full gradient-kaamyab hover:opacity-90 touch-press h-12 text-base font-medium"
              >
                {isCompleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Task
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

      {/* Expandable Explanation Section */}
      {hasExplanation && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-between px-5 py-3 text-sm",
                "border-t border-border/20 bg-muted/30 hover:bg-muted/50 transition-colors",
                "text-primary font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                How to do this
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
              {/* How - Step by step */}
              {task.explanation?.how && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    What to do
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {task.explanation.how}
                  </p>
                </div>
              )}

              {/* Why - Importance */}
              {task.explanation?.why && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Why this matters
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {task.explanation.why}
                  </p>
                </div>
              )}

              {/* Expected Outcome */}
              {task.explanation?.expected_outcome && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Expected outcome
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {task.explanation.expected_outcome}
                  </p>
                </div>
              )}

              {/* Common mistake hint */}
              <div className="pt-2 border-t border-border/10">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-500/70" />
                  <span>Tip: Focus on completing, not perfecting. Done is better than perfect.</span>
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}
