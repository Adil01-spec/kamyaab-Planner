import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  completed: boolean;
  onToggle: () => void;
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

export function TaskItem({ title, priority, estimatedHours, completed, onToggle }: TaskItemProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl glass-subtle click-feedback cursor-pointer group transition-all duration-200",
        completed && "task-completed"
      )}
      onClick={onToggle}
    >
      <Checkbox
        checked={completed}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "mt-0.5 h-5 w-5 rounded-md border-2 checkbox-fill",
          completed 
            ? "border-primary bg-primary data-[state=checked]:bg-primary" 
            : "border-muted-foreground/40 hover:border-primary/60"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-foreground task-title transition-all duration-200",
          completed && "line-through text-muted-foreground"
        )}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs transition-opacity duration-200",
              getPriorityColor(priority),
              completed && "opacity-50"
            )}
          >
            {priority}
          </Badge>
          <span className={cn(
            "text-xs text-muted-foreground flex items-center gap-1 transition-opacity duration-200",
            completed && "opacity-50"
          )}>
            <Clock className="w-3 h-3" />
            {estimatedHours}h
          </span>
        </div>
      </div>
    </div>
  );
}