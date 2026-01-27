import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { TaskItem } from '@/components/TaskItem';
import { cn } from '@/lib/utils';
import { hapticSelection, hapticLight } from '@/lib/hapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface ReorderableTaskItemProps {
  task: Task;
  weekIndex: number;
  taskIndex: number;
  weekNumber: number;
  isLocked: boolean;
  isActiveWeek: boolean;
  isWeekComplete: boolean;
  planCreatedAt?: string;
  onToggle: () => void;
  onCalendarStatusChange?: () => void;
  onStartTask?: () => void;
  executionState: 'pending' | 'doing' | 'done';
  elapsedSeconds: number;
  isDragging?: boolean;
}

export function ReorderableTaskItem({
  task,
  weekIndex,
  taskIndex,
  weekNumber,
  isLocked,
  isActiveWeek,
  isWeekComplete,
  planCreatedAt,
  onToggle,
  onCalendarStatusChange,
  onStartTask,
  executionState,
  elapsedSeconds,
  isDragging = false,
}: ReorderableTaskItemProps) {
  const dragControls = useDragControls();
  const isMobile = useIsMobile();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) return;
    
    // Trigger haptic on drag start
    hapticSelection();
    dragControls.start(e);
  };

  const handleDragEnd = () => {
    // Trigger haptic on drop
    hapticLight();
  };

  const taskContent = (
    <div className={cn(
      "flex items-stretch gap-0",
      isDragging && "opacity-90"
    )}>
      {/* Drag Handle */}
      {!isLocked && (
        <div
          onPointerDown={handlePointerDown}
          className={cn(
            "flex items-center justify-center cursor-grab active:cursor-grabbing touch-none",
            "w-8 shrink-0 rounded-l-xl",
            "transition-all duration-200",
            // Desktop: hidden until hover
            !isMobile && "opacity-0 group-hover:opacity-100",
            // Mobile: always visible but muted
            isMobile && "opacity-40",
            // Hover/active states
            "hover:opacity-100 hover:bg-muted/50",
            "active:bg-primary/10"
          )}
          style={{
            // Prevent text selection during drag
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Task Item Container */}
      <div className={cn(
        "flex-1 min-w-0 group",
        !isLocked && "-ml-2" // Overlap with handle area for seamless look
      )}>
        <TaskItem
          title={task.title}
          priority={task.priority}
          estimatedHours={task.estimated_hours}
          completed={task.completed || false}
          onToggle={onToggle}
          explanation={task.explanation}
          howTo={task.how_to}
          expectedOutcome={task.expected_outcome}
          isLocked={isLocked}
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

  // For locked tasks, render without Reorder.Item wrapper
  if (isLocked) {
    return <div className="relative">{taskContent}</div>;
  }

  // For unlocked tasks, wrap in Reorder.Item for drag functionality
  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={handleDragEnd}
      className="relative"
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        zIndex: 10,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      layout
    >
      {taskContent}
    </Reorder.Item>
  );
}
