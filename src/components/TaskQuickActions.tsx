import { Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskQuickActionsProps {
  isVisible: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Desktop-only hover quick actions for task cards
 * Shows edit/delete buttons on hover
 */
const TaskQuickActions = ({ isVisible, onEdit, onDelete }: TaskQuickActionsProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="hidden sm:flex items-center gap-1 ml-2"
        >
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-md transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              aria-label="Edit task"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskQuickActions;
