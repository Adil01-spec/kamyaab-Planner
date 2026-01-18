import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDevMode } from '@/contexts/DevModeContext';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Copy, Check, RefreshCw, X, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DevPanelProps {
  pageId: string;
  data: Record<string, any>;
  className?: string;
}

const STORAGE_KEY = 'kaamyab_dev_panel_collapsed';

export function DevPanel({ pageId, data, className }: DevPanelProps) {
  const { isDevMode, deactivateDevMode } = useDevMode();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return true;
    }
  });
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Don't render if not in dev mode
  if (!isDevMode) return null;

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    try {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    } catch {}
  };

  const handleCopy = async () => {
    try {
      const debugData = {
        pageId,
        timestamp: new Date().toISOString(),
        ...data,
      };
      await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  // Check for potential issues in the data
  const hasWarnings = data.todaysTasks?.some(
    (t: any) => t.legacy_done_without_completed || 
    (t.execution_state === 'done' && !t.completed)
  );

  return (
    <Card
      className={cn(
        'mt-6 border-border/50 bg-card/90 backdrop-blur-sm font-mono text-xs overflow-hidden',
        hasWarnings && 'border-amber-500/50',
        className
      )}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">
            Dev Panel: /{pageId}
          </span>
          {hasWarnings && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded">
              ⚠ warnings
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-[10px] hidden sm:inline">
            {import.meta.env.DEV ? 'DEV' : 'PROD'}
          </span>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-3 border-t border-border/30">
              {/* Actions bar */}
              <div className="flex items-center gap-2 py-2 border-b border-border/20 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                >
                  {copied ? (
                    <Check className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                {!import.meta.env.DEV && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      deactivateDevMode();
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Exit Dev Mode
                  </Button>
                )}
              </div>

              {/* Debug data */}
              <pre
                key={refreshKey}
                className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words text-foreground/80 bg-muted/30 rounded p-2"
              >
                {JSON.stringify(
                  { timestamp: new Date().toISOString(), ...data },
                  null,
                  2
                )}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
