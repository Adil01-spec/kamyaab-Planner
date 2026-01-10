import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Target, CheckCircle2, Circle, MinusCircle, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

interface PlanFlowViewProps {
  weeks: Week[];
  identityStatement?: string;
  projectTitle?: string;
  className?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const PlanFlowView = ({
  weeks,
  identityStatement,
  projectTitle,
  className,
  onInteractionStart,
  onInteractionEnd
}: PlanFlowViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isInteracting, setIsInteracting] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; distance?: number } | null>(null);

  const flowData = useMemo(() => {
    return weeks.map(week => ({
      ...week,
      allCompleted: week.tasks.every(t => t.completed),
      someCompleted: week.tasks.some(t => t.completed) && !week.tasks.every(t => t.completed),
      completedCount: week.tasks.filter(t => t.completed).length
    }));
  }, [weeks]);

  // Calculate initial scale based on viewport
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const viewportWidth = containerRef.current.offsetWidth;
        // Auto-scale to fit viewport on mobile
        if (viewportWidth < 600) {
          setScale(Math.max(0.6, viewportWidth / 700));
        } else {
          setScale(1);
        }
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Prevent browser back-swipe and enable content scrolling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsInteracting(true);
    onInteractionStart?.();
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Handle pinch-to-zoom
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current.distance = Math.sqrt(dx * dx + dy * dy);
    }
  }, [onInteractionStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    // Prevent default to stop browser back-swipe
    e.stopPropagation();
    
    // Handle pinch-to-zoom
    if (e.touches.length === 2 && touchStartRef.current.distance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = newDistance / touchStartRef.current.distance;
      
      setScale(prev => Math.min(2, Math.max(0.5, prev * scaleDelta)));
      touchStartRef.current.distance = newDistance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsInteracting(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  // Prevent wheel events from propagating
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
  }, []);

  const getNodeStyles = (completed: boolean, skipped: boolean = false) => {
    if (completed) {
      return 'bg-primary/10 border-primary/30 text-primary';
    }
    if (skipped) {
      return 'bg-muted/30 border-dashed border-muted-foreground/30 text-muted-foreground/50';
    }
    return 'bg-card border-border text-foreground';
  };

  const getTaskIcon = (completed?: boolean) => {
    if (completed) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />;
    }
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />;
  };

  const handleZoomIn = () => setScale(prev => Math.min(2, prev + 0.2));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const handleResetZoom = () => setScale(1);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative py-4 touch-pan-x touch-pan-y",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border border-border/50">
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded transition-colors"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Scrollable Container */}
      <div 
        className="overflow-auto max-h-[60vh] sm:max-h-[70vh] overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          ref={contentRef}
          className="min-w-max px-4 pb-4 origin-top-left transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Root Node - Plan/Goal */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-3 shadow-lg shadow-primary/5">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center max-w-[280px]">
                <p className="font-semibold text-foreground text-sm">
                  {projectTitle || 'Your Plan'}
                </p>
                {identityStatement && (
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">
                    "{identityStatement}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Connector line from root */}
          <div className="flex justify-center mb-4">
            <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-border" />
          </div>

          {/* Weeks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" style={{ minWidth: '300px' }}>
            {flowData.map((week) => (
              <div key={week.week} className="relative min-w-[250px]">
                {/* Week Node */}
                <div
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    getNodeStyles(week.allCompleted)
                  )}
                >
                  {/* Week Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        week.allCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {week.week}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Week {week.week}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{week.focus}</p>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1.5">
                    {week.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={cn(
                          "flex items-start gap-2 py-1.5 px-2 rounded-lg transition-all text-xs",
                          task.completed
                            ? "bg-primary/5 text-muted-foreground/60"
                            : "bg-muted/30 text-foreground/80"
                        )}
                      >
                        {getTaskIcon(task.completed)}
                        <span
                          className={cn(
                            "flex-1 leading-tight line-clamp-2",
                            task.completed && "line-through"
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Week Progress */}
                  <div className="mt-3 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{week.completedCount}/{week.tasks.length} tasks</span>
                      <span>{Math.round((week.completedCount / week.tasks.length) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="w-4 h-4 text-muted-foreground/50" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MinusCircle className="w-4 h-4 text-muted-foreground/30" />
              <span>Skipped</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hint */}
      <div className="sm:hidden flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground/60">
        <Move className="w-3 h-3" />
        <span>Scroll & pinch to explore</span>
      </div>
    </div>
  );
};
