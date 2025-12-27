import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, ChevronDown, HelpCircle, Target, Lock, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskExplanation {
  how: string;
  why: string;
  expected_outcome: string;
}

interface TaskItemProps {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  completed: boolean;
  onToggle: () => void;
  explanation?: TaskExplanation | string;
  howTo?: string;
  expectedOutcome?: string;
  isLocked?: boolean;
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

// Helper to normalize explanation structure
function getExplanationDetails(props: TaskItemProps): {
  how: string;
  why: string;
  expectedOutcome: string;
  hasDetails: boolean;
  needsRegeneration: boolean;
} {
  const { explanation, howTo, expectedOutcome } = props;
  
  // Handle nested explanation object (new structure)
  if (explanation && typeof explanation === 'object') {
    const exp = explanation as TaskExplanation;
    const hasDetails = !!(exp.how || exp.why || exp.expected_outcome);
    return {
      how: exp.how || '',
      why: exp.why || '',
      expectedOutcome: exp.expected_outcome || '',
      hasDetails,
      needsRegeneration: !hasDetails
    };
  }
  
  // Handle flat structure (legacy)
  const legacyWhy = typeof explanation === 'string' ? explanation : '';
  const hasDetails = !!(legacyWhy || howTo || expectedOutcome);
  
  return {
    how: howTo || '',
    why: legacyWhy,
    expectedOutcome: expectedOutcome || '',
    hasDetails,
    needsRegeneration: !hasDetails
  };
}

export function TaskItem({ 
  title, 
  priority, 
  estimatedHours, 
  completed, 
  onToggle,
  explanation,
  howTo,
  expectedOutcome,
  isLocked = false,
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const details = getExplanationDetails({ 
    title, priority, estimatedHours, completed, onToggle,
    explanation, howTo, expectedOutcome, isLocked 
  });

  const handleClick = () => {
    if (isLocked) return;
    onToggle();
  };

  const handleCheckboxChange = () => {
    if (isLocked) return;
    onToggle();
  };

  return (
    <div 
      className={cn(
        "rounded-xl glass-subtle transition-all duration-200",
        isLocked && "opacity-60 cursor-not-allowed",
        !isLocked && "click-feedback"
      )}
    >
      <div 
        className={cn(
          "flex items-start gap-3 p-4 cursor-pointer group",
          completed && "task-completed"
        )}
        onClick={handleClick}
      >
        <div className="relative">
          {isLocked ? (
            <div className="mt-0.5 h-5 w-5 rounded-md border-2 border-muted-foreground/30 flex items-center justify-center bg-muted/30">
              <Lock className="w-3 h-3 text-muted-foreground/50" />
            </div>
          ) : (
            <Checkbox
              checked={completed}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mt-0.5 h-5 w-5 rounded-md border-2 checkbox-fill",
                completed 
                  ? "border-primary bg-primary data-[state=checked]:bg-primary" 
                  : "border-muted-foreground/40 hover:border-primary/60"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-foreground task-title transition-all duration-200",
            completed && "line-through text-muted-foreground",
            isLocked && "text-muted-foreground"
          )}>
            {title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs transition-opacity duration-200",
                getPriorityColor(priority),
                (completed || isLocked) && "opacity-50"
              )}
            >
              {priority}
            </Badge>
            <span className={cn(
              "text-xs text-muted-foreground flex items-center gap-1 transition-opacity duration-200",
              (completed || isLocked) && "opacity-50"
            )}>
              <Clock className="w-3 h-3" />
              {estimatedHours}h
            </span>
            
            {/* Show warning for tasks without explanations */}
            {details.needsRegeneration && !isLocked && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Needs guidance</span>
              </span>
            )}
            
            {/* Expand button for tasks with details */}
            {details.hasDetails && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }}
                    className={cn(
                      "text-xs text-primary flex items-center gap-1 hover:underline transition-colors",
                      (completed || isLocked) && "opacity-50"
                    )}
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>How to do this</span>
                    <ChevronDown className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} />
                  </button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
      
      {/* Expandable Details Section */}
      {details.hasDetails && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className={cn(
              "px-4 pb-4 space-y-3 border-t border-border/30 mx-4 mb-4 pt-3",
              (completed || isLocked) && "opacity-60"
            )}>
              {details.how && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base">🔧</span>
                    <span>How to do it</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.how}</p>
                </div>
              )}
              
              {details.why && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Why it matters</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.why}</p>
                </div>
              )}
              
              {details.expectedOutcome && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Expected outcome</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.expectedOutcome}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Fallback UI for tasks without explanations */}
      {details.needsRegeneration && !isLocked && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This task lacks guidance. Regenerate your plan for detailed steps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
