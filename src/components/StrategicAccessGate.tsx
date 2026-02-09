import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { useStrategicAccess } from '@/hooks/useStrategicAccess';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
 * 
 * Access is now strictly: paid = full, trial unused = preview, trial used = none.
 * No progress indicators needed since completion doesn't grant access.
 */
export function StrategicAccessGate({ 
  children, 
  fallback,
  showPreviewMessage = true,
}: StrategicAccessGateProps) {
  const { level, reason, isLoading } = useStrategicAccess();

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
        {showPreviewMessage && <PreviewAccessMessage />}
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
function PreviewAccessMessage() {
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
            This is your one-time strategic preview.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade to Pro for unlimited strategic planning and regeneration.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Message shown when user has no strategic access
 */
function NoAccessMessage({ reason }: { reason: string }) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted/50 border border-border/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-sm text-foreground font-medium">
              Strategic Planning
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {reason}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/pricing')}
          >
            View Plans
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
