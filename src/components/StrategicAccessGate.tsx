import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useStrategicAccess } from '@/hooks/useStrategicAccess';
import { getStrategicAccessMessage } from '@/lib/strategicAccessResolver';

interface StrategicAccessGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  showPreviewMessage?: boolean;
}

/**
 * Wraps strategic planning features and shows appropriate messaging
 * based on user's access level.
 * 
 * Uses calm, non-accusatory language per the design philosophy.
 */
export function StrategicAccessGate({ 
  children, 
  fallback,
  showPreviewMessage = true,
}: StrategicAccessGateProps) {
  const { level, reason, isLoading, planHistoryCount, completedTasksCount } = useStrategicAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground text-sm">
          Loading...
        </div>
      </div>
    );
  }

  // Full access - render children directly
  if (level === 'full') {
    return <>{children}</>;
  }

  // Preview access - render children with post-action message
  if (level === 'preview') {
    return (
      <div className="space-y-4">
        {children}
        {showPreviewMessage && (
          <PreviewAccessMessage 
            planHistoryCount={planHistoryCount} 
            completedTasksCount={completedTasksCount}
          />
        )}
      </div>
    );
  }

  // No access - show fallback or locked message
  if (fallback) {
    return <>{fallback}</>;
  }

  return <NoAccessMessage reason={reason} />;
}

/**
 * Calm message shown after strategic preview generation
 */
function PreviewAccessMessage({ 
  planHistoryCount, 
  completedTasksCount 
}: { 
  planHistoryCount: number;
  completedTasksCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-accent/50 border border-border/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">
            To refine this strategy, Kaamyab needs to learn how you actually work.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Complete your first plan cycle to unlock full strategic planning.
          </p>
          
          {/* Progress indicators */}
          <div className="flex items-center gap-4 mt-3">
            <ProgressIndicator
              icon={<Clock className="w-3 h-3" />}
              label="Plan cycles"
              current={planHistoryCount}
              target={1}
            />
            <ProgressIndicator
              icon={<CheckCircle2 className="w-3 h-3" />}
              label="Tasks completed"
              current={completedTasksCount}
              target={3}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Message shown when user has no strategic access
 */
function NoAccessMessage({ reason }: { reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted/50 border border-border/50 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Small progress indicator for access requirements
 */
function ProgressIndicator({
  icon,
  label,
  current,
  target,
}: {
  icon: ReactNode;
  label: string;
  current: number;
  target: number;
}) {
  const isComplete = current >= target;
  
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={isComplete ? 'text-primary' : 'text-muted-foreground'}>
        {icon}
      </span>
      <span className={isComplete ? 'text-primary font-medium' : 'text-muted-foreground'}>
        {current}/{target} {label}
      </span>
      {isComplete && (
        <CheckCircle2 className="w-3 h-3 text-primary" />
      )}
    </div>
  );
}
