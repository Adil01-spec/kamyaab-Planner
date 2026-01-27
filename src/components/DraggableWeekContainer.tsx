import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  completed?: boolean;
  [key: string]: any;
}

interface DraggableWeekContainerProps {
  weekIndex: number;
  weekNumber: number;
  tasks: Task[];
  taskIds: string[];
  isActiveWeek: boolean;
  isLockedWeek: boolean;
  isWeekComplete: boolean;
  isDraggedOver: boolean;
  isCrossWeekDrag: boolean;
  children: React.ReactNode;
}

/**
 * Droppable container for each week that accepts tasks from any week.
 * Provides visual feedback when tasks are dragged over.
 */
export function DraggableWeekContainer({
  weekIndex,
  weekNumber,
  tasks,
  taskIds,
  isActiveWeek,
  isLockedWeek,
  isWeekComplete,
  isDraggedOver,
  isCrossWeekDrag,
  children,
}: DraggableWeekContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-${weekIndex}`,
    data: {
      weekIndex,
      type: 'week',
    },
  });

  // Combine isDraggedOver prop with local isOver state
  const showDropIndicator = isDraggedOver || isOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-2 rounded-lg transition-all duration-200 p-1 -m-1",
        // Highlight when dragged over
        showDropIndicator && isCrossWeekDrag && [
          "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
          "bg-primary/5"
        ],
        showDropIndicator && !isCrossWeekDrag && "bg-muted/30"
      )}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}
