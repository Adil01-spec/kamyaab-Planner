import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Target,
  Lightbulb,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateFallbackExplanation } from '@/lib/dailyContextEngine';

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

interface TodayTaskDetailsPanelProps {
  selectedTask: {
    task: Task;
    weekNumber: number;
    weekFocus: string;
  } | null;
  dayType?: 'light' | 'normal' | 'recovery' | 'push';
}

// Convert hours to friendly time hint
const getTimeHint = (hours: number): string => {
  if (hours <= 0.5) return '~30 min';
  if (hours <= 1) return '~1 hour';
  if (hours <= 2) return 'Deep focus session';
  return `~${hours} hours`;
};

// Generate why this matters today based on task and week context
const generateWhyToday = (task: Task, weekFocus: string, dayType?: string): string => {
  const baseReason = task.explanation?.why;
  
  if (baseReason) {
    return baseReason;
  }
  
  // Generate contextual reason
  const title = task.title.toLowerCase();
  
  if (dayType === 'push') {
    return `With your current momentum, tackling "${task.title}" will reinforce your streak and keep progress strong.`;
  }
  
  if (dayType === 'recovery') {
    return `This smaller step helps you rebuild momentum without overwhelming yourself.`;
  }
  
  if (title.includes('review') || title.includes('check')) {
    return `Reviewing now prevents issues from compounding later in your ${weekFocus} work.`;
  }
  
  if (title.includes('start') || title.includes('begin') || title.includes('draft')) {
    return `Starting this today gives you runway to refine it throughout the week.`;
  }
  
  return `This task directly supports your Week ${weekFocus} focus and maintains project momentum.`;
};

// Format explanation "how" into bullet points
const formatHowToBullets = (how: string): string[] => {
  if (!how) return [];
  
  const lines = how
    .split(/(?:\n|(?<=\.)\s+(?=[A-Z])|(?:^\d+\.\s*))/gm)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 100);
  
  return lines.slice(0, 4);
};

export function TodayTaskDetailsPanel({ selectedTask, dayType }: TodayTaskDetailsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-fit"
    >
      <AnimatePresence mode="wait">
        {selectedTask ? (
          <motion.div
            key={selectedTask.task.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border/30 bg-card/50 p-5 space-y-5"
          >
            {/* Task Header */}
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>Week {selectedTask.weekNumber}</span>
                <span>•</span>
                <span className="truncate">{selectedTask.weekFocus}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedTask.task.title}
              </h3>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{getTimeHint(selectedTask.task.estimated_hours)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary/70 bg-primary/5 px-2.5 py-1 rounded-full">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Scheduled today</span>
                </div>
              </div>
            </div>
            
            {/* Why This Matters Today */}
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                    Why this matters today
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {generateWhyToday(selectedTask.task, selectedTask.weekFocus, dayType)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* How to Do This */}
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="flex items-start gap-2.5">
                <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
                    How to approach this
                  </p>
                  
                  {selectedTask.task.explanation?.how ? (
                    <ul className="space-y-2">
                      {formatHowToBullets(selectedTask.task.explanation.how).map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {generateFallbackExplanation(selectedTask.task.title)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Expected Outcome */}
            {selectedTask.task.explanation?.expected_outcome && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  Expected outcome
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {selectedTask.task.explanation.expected_outcome}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-border/40 bg-muted/10 p-8 flex flex-col items-center justify-center text-center min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Select a task to see details
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Hover or click on any task
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
