import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskItem } from '@/components/TaskItem';
import { cn } from '@/lib/utils';
import { hapticSelection, hapticLight } from '@/lib/hapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  explanation?: TaskExplanation | string;
  how_to?: string;
  expected_outcome?: string;
  execution_state?: 'pending' | 'doing' | 'done';
  [key: string]: any;
}

interface DraggableTaskItemProps {
  task: Task;
  taskId: string;
  weekIndex: number;
  taskIndex: number;
  weekNumber: number;
  isActiveWeek: boolean;
  isWeekComplete: boolean;
  isLockedWeek: boolean;
  planCreatedAt?: string;
  onToggle: () => void;
  onCalendarStatusChange?: () => void;
  onStartTask?: () => void;
  executionState: 'pending' | 'doing' | 'done';
  elapsedSeconds: number;
  canDrag: boolean;
  blockReason?: string;
  isOverlay?: boolean;
}

export function DraggableTaskItem({
  task,
  taskId,
  weekIndex,
  taskIndex,
  weekNumber,
  isActiveWeek,
  isWeekComplete,
  isLockedWeek,
  planCreatedAt,
  onToggle,
  onCalendarStatusChange,
  onStartTask,
  executionState,
  elapsedSeconds,
  canDrag,
  blockReason,
  isOverlay = false,
}: DraggableTaskItemProps) {
  const isMobile = useIsMobile();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskId,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleDragStart = () => {
    hapticSelection();
  };

  const handleDragEnd = () => {
    hapticLight();
  };

  const dragHandle = canDrag ? (
    <div
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        handleDragStart();
        listeners?.onPointerDown?.(e);
      }}
      onPointerUp={handleDragEnd}
      className={cn(
        "flex items-center justify-center cursor-grab active:cursor-grabbing touch-none",
        "w-8 shrink-0 rounded-l-xl",
        "transition-all duration-200",
        // Desktop: visible on hover of parent group
        !isMobile && "opacity-30 group-hover:opacity-100",
        // Mobile: always visible
        isMobile && "opacity-50",
        // Hover/active states
        "hover:opacity-100 hover:bg-muted/50",
        "active:bg-primary/10"
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-center cursor-not-allowed",
              "w-8 shrink-0 rounded-l-xl",
              "opacity-30"
            )}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="text-sm">{blockReason || 'Cannot move this task'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const content = (
    <div
      className={cn(
        "flex items-stretch gap-0",
        isDragging && "opacity-90",
        isOverlay && "shadow-lg rounded-xl bg-background border border-border"
      )}
    >
      {/* Drag Handle */}
      {dragHandle}

      {/* Task Item Container */}
      <div className={cn("flex-1 min-w-0", canDrag && "-ml-2")}>
        <TaskItem
          title={task.title}
          priority={task.priority}
          estimatedHours={task.estimated_hours}
          completed={task.completed || false}
          onToggle={onToggle}
          explanation={task.explanation}
          howTo={task.how_to}
          expectedOutcome={task.expected_outcome}
          isLocked={isLockedWeek}
          weekNumber={weekNumber}
          taskIndex={taskIndex}
          showCalendarButton={isActiveWeek && !isWeekComplete}
          planCreatedAt={planCreatedAt}
          onCalendarStatusChange={onCalendarStatusChange}
          onStartTask={onStartTask}
          executionState={executionState}
          elapsedSeconds={elapsedSeconds}
        />
      </div>
    </div>
  );

  // For overlay (dragging preview), render without ref
  if (isOverlay) {
    return <div className="relative group">{content}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50"
      )}
    >
      {content}
    </div>
  );
}
