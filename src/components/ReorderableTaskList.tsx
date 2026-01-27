import { Reorder } from 'framer-motion';
import { ReorderableTaskItem } from '@/components/ReorderableTaskItem';

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

interface ActiveTimer {
  weekIndex: number;
  taskIndex: number;
}

interface ReorderableTaskListProps {
  tasks: Task[];
  weekIndex: number;
  weekNumber: number;
  isLockedWeek: boolean;
  isActiveWeek: boolean;
  isWeekComplete: boolean;
  planCreatedAt?: string;
  onReorder: (weekIndex: number, reorderedTasks: Task[]) => void;
  onToggleTask: (weekIndex: number, taskIndex: number) => void;
  onCalendarStatusChange?: () => void;
  onStartTask: (weekIndex: number, taskIndex: number, title: string, estimatedHours: number) => void;
  activeTimer?: ActiveTimer | null;
  elapsedSeconds: number;
}

/**
 * Container component that wraps tasks in a reorderable list.
 * Uses framer-motion's Reorder.Group for smooth drag-and-drop.
 * 
 * Reordering is disabled for locked weeks.
 */
export function ReorderableTaskList({
  tasks,
  weekIndex,
  weekNumber,
  isLockedWeek,
  isActiveWeek,
  isWeekComplete,
  planCreatedAt,
  onReorder,
  onToggleTask,
  onCalendarStatusChange,
  onStartTask,
  activeTimer,
  elapsedSeconds,
}: ReorderableTaskListProps) {
  const handleReorder = (reorderedTasks: Task[]) => {
    // Only allow reordering if week is not locked
    if (!isLockedWeek) {
      onReorder(weekIndex, reorderedTasks);
    }
  };

  // For locked weeks, render without reorder capability
  if (isLockedWeek) {
    return (
      <div className="space-y-2">
        {tasks.map((task, taskIndex) => (
          <div key={`${task.title}-${taskIndex}`} className="group">
            <ReorderableTaskItem
              task={task}
              weekIndex={weekIndex}
              taskIndex={taskIndex}
              weekNumber={weekNumber}
              isLocked={true}
              isActiveWeek={isActiveWeek}
              isWeekComplete={isWeekComplete}
              planCreatedAt={planCreatedAt}
              onToggle={() => onToggleTask(weekIndex, taskIndex)}
              onCalendarStatusChange={onCalendarStatusChange}
              onStartTask={() => onStartTask(weekIndex, taskIndex, task.title, task.estimated_hours)}
              executionState={getExecutionState(task, weekIndex, taskIndex, activeTimer)}
              elapsedSeconds={getElapsedSeconds(weekIndex, taskIndex, activeTimer, elapsedSeconds)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={tasks}
      onReorder={handleReorder}
      className="space-y-2"
      style={{
        // Enable vertical scrolling, prevent horizontal
        touchAction: 'pan-y',
      }}
    >
      {tasks.map((task, taskIndex) => (
        <ReorderableTaskItem
          key={`${task.title}-${taskIndex}`}
          task={task}
          weekIndex={weekIndex}
          taskIndex={taskIndex}
          weekNumber={weekNumber}
          isLocked={false}
          isActiveWeek={isActiveWeek}
          isWeekComplete={isWeekComplete}
          planCreatedAt={planCreatedAt}
          onToggle={() => onToggleTask(weekIndex, taskIndex)}
          onCalendarStatusChange={onCalendarStatusChange}
          onStartTask={() => onStartTask(weekIndex, taskIndex, task.title, task.estimated_hours)}
          executionState={getExecutionState(task, weekIndex, taskIndex, activeTimer)}
          elapsedSeconds={getElapsedSeconds(weekIndex, taskIndex, activeTimer, elapsedSeconds)}
        />
      ))}
    </Reorder.Group>
  );
}

/**
 * Helper to determine execution state for a task
 */
function getExecutionState(
  task: Task,
  weekIndex: number,
  taskIndex: number,
  activeTimer?: ActiveTimer | null
): 'pending' | 'doing' | 'done' {
  if (task.execution_state === 'doing') return 'doing';
  if (task.execution_state === 'done') return 'done';
  
  // Check if this task has an active timer
  if (activeTimer?.weekIndex === weekIndex && activeTimer?.taskIndex === taskIndex) {
    return 'doing';
  }
  
  return 'pending';
}

/**
 * Helper to get elapsed seconds for a task
 */
function getElapsedSeconds(
  weekIndex: number,
  taskIndex: number,
  activeTimer?: ActiveTimer | null,
  elapsedSeconds: number = 0
): number {
  if (activeTimer?.weekIndex === weekIndex && activeTimer?.taskIndex === taskIndex) {
    return elapsedSeconds;
  }
  return 0;
}
