import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, ChevronDown, Info, Target, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  completed: boolean;
  onToggle: () => void;
  explanation?: string;
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
  const hasDetails = explanation || howTo || expectedOutcome;

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
            {hasDetails && (
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
                    <Info className="w-3 h-3" />
                    <span>Details</span>
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
      {hasDetails && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className={cn(
              "px-4 pb-4 pt-0 space-y-3 border-t border-border/30 mt-2 pt-3 mx-4 mb-4",
              (completed || isLocked) && "opacity-60"
            )}>
              {explanation && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Why it matters
                  </p>
                  <p className="text-sm text-foreground/80">{explanation}</p>
                </div>
              )}
              
              {howTo && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <span>How to do it</span>
                  </p>
                  <p className="text-sm text-foreground/80">{howTo}</p>
                </div>
              )}
              
              {expectedOutcome && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>Expected outcome</span>
                  </p>
                  <p className="text-sm text-foreground/80">{expectedOutcome}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
