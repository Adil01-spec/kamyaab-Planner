import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, ChevronDown, HelpCircle, Target, Lock, AlertTriangle, Lightbulb, CalendarPlus, CalendarCheck, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSingleTaskCalendarEvent, isAppleDevice, getPlanStartDate, calculateTaskEventDate } from '@/lib/calendarService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { playCalendarConfirmSound } from '@/lib/celebrationSound';
import { hapticSuccess } from '@/lib/hapticFeedback';
import { 
  useTaskCalendarStatus, 
  getTaskCalendarStatus, 
  markTaskAsScheduled,
} from '@/hooks/useCalendarStatus';

// Legacy export for backward compatibility
export const isTaskAddedToCalendar = (weekNumber: number, taskIndex: number): boolean => {
  const status = getTaskCalendarStatus(weekNumber, taskIndex);
  return status.status === 'scheduled';
};

export const markWeekTasksAsCalendarAdded = (weekNumber: number, taskCount: number) => {
  for (let i = 0; i < taskCount; i++) {
    const suggestedDate = new Date();
    suggestedDate.setHours(9, 0, 0, 0);
    markTaskAsScheduled(weekNumber, i, suggestedDate);
  }
};

interface TaskExplanation {
  how: string;
  why: string;
  expected_outcome: string;
}

interface TaskItemProps {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  completed: boolean;
  onToggle: () => void;
  explanation?: TaskExplanation | string;
  howTo?: string;
  expectedOutcome?: string;
  isLocked?: boolean;
  weekNumber?: number;
  taskIndex?: number;
  showCalendarButton?: boolean;
  planCreatedAt?: string;
  onCalendarStatusChange?: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Low':
      return 'bg-primary/10 text-primary border-primary/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Helper to normalize explanation structure
function getExplanationDetails(props: TaskItemProps): {
  how: string;
  why: string;
  expectedOutcome: string;
  hasDetails: boolean;
  needsRegeneration: boolean;
} {
  const { explanation, howTo, expectedOutcome } = props;
  
  // Handle nested explanation object (new structure)
  if (explanation && typeof explanation === 'object') {
    const exp = explanation as TaskExplanation;
    const hasDetails = !!(exp.how || exp.why || exp.expected_outcome);
    return {
      how: exp.how || '',
      why: exp.why || '',
      expectedOutcome: exp.expected_outcome || '',
      hasDetails,
      needsRegeneration: !hasDetails
    };
  }
  
  // Handle flat structure (legacy)
  const legacyWhy = typeof explanation === 'string' ? explanation : '';
  const hasDetails = !!(legacyWhy || howTo || expectedOutcome);
  
  return {
    how: howTo || '',
    why: legacyWhy,
    expectedOutcome: expectedOutcome || '',
    hasDetails,
    needsRegeneration: !hasDetails
  };
}

export function TaskItem({ 
  title, 
  priority, 
  estimatedHours, 
  completed, 
  onToggle,
  explanation,
  howTo,
  expectedOutcome,
  isLocked = false,
  weekNumber,
  taskIndex,
  showCalendarButton = false,
  planCreatedAt,
  onCalendarStatusChange,
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>('9');
  const [calendarOpened, setCalendarOpened] = useState(false); // Track if user has opened calendar
  
  // Use the simplified calendar status hook
  const { 
    status: calendarStatus, 
    scheduledAt,
    markScheduled, 
    reset: resetCalendarStatus,
    refresh: refreshCalendarStatus,
  } = useTaskCalendarStatus(weekNumber, taskIndex);
  
  // Calculate the scheduled date for preview
  const getScheduledDate = (): Date | null => {
    if (weekNumber === undefined || taskIndex === undefined) return null;
    const planStartDate = getPlanStartDate(planCreatedAt);
    return calculateTaskEventDate(planStartDate, weekNumber, taskIndex);
  };
  
  const suggestedDate = getScheduledDate();
  
  // Initialize selected date when popover opens
  useEffect(() => {
    if (calendarPopoverOpen && suggestedDate && !selectedDate) {
      setSelectedDate(suggestedDate);
    }
  }, [calendarPopoverOpen, suggestedDate, selectedDate]);
  
  const details = getExplanationDetails({
    title, priority, estimatedHours, completed, onToggle,
    explanation, howTo, expectedOutcome, isLocked 
  });

  const handleClick = () => {
    if (isLocked) return;
    onToggle();
  };

  const handleCheckboxChange = () => {
    if (isLocked) return;
    onToggle();
  };

  // Opens external calendar ONLY - does NOT update any state
  const handleOpenCalendar = (customDate?: Date) => {
    if (weekNumber !== undefined && taskIndex !== undefined) {
      const taskInput = {
        title,
        priority,
        estimated_hours: estimatedHours,
        explanation,
        how_to: howTo,
        expected_outcome: expectedOutcome
      };
      
      // Use plan's created_at date for correct future date calculation
      const planStartDate = getPlanStartDate(planCreatedAt);
      createSingleTaskCalendarEvent(taskInput, weekNumber, taskIndex, planStartDate, customDate);
      
      // Track that calendar was opened (for showing inline actions)
      setCalendarOpened(true);
      setCalendarPopoverOpen(false);
      
      const dateToShow = customDate || suggestedDate;
      toast({
        title: "Calendar opened",
        description: dateToShow 
          ? `Add "${title}" for ${format(dateToShow, 'EEEE, MMM d')} at ${format(dateToShow, 'h:mm a')}.`
          : `Add "${title}" to your calendar.`,
      });
    }
  };
  
  // User explicitly confirms they added to calendar
  const handleMarkAsScheduled = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Use the selected date or suggested date
    const dateToUse = selectedDate || suggestedDate;
    if (!dateToUse) {
      toast({
        title: "No date selected",
        description: "Please select a date first.",
        variant: "destructive",
      });
      return;
    }
    
    // Create date with selected hour
    const scheduledDate = new Date(dateToUse);
    scheduledDate.setHours(parseInt(selectedHour), 0, 0, 0);
    
    hapticSuccess();
    playCalendarConfirmSound();
    markScheduled(scheduledDate);
    setCalendarOpened(false);
    
    toast({
      title: "Marked as scheduled",
      description: `"${title}" scheduled for ${format(scheduledDate, 'EEEE, MMM d')} at ${format(scheduledDate, 'h:mm a')}.`,
    });
    
    // Notify parent to refresh weekly calendar
    onCalendarStatusChange?.();
  };
  
  // User wants to add again
  const handleAddAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetCalendarStatus();
    setCalendarOpened(false);
    onCalendarStatusChange?.();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenCalendar();
  };

  const handleCustomDateAdd = () => {
    if (selectedDate) {
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(parseInt(selectedHour), 0, 0, 0);
      handleOpenCalendar(dateWithTime);
    }
  };

  // Generate time options
  const timeOptions = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 6; // 6 AM to 7 PM
    return {
      value: hour.toString(),
      label: format(new Date().setHours(hour, 0), 'h:mm a'),
    };
  });
  
  // Determine what UI to show
  const showScheduledBadge = calendarStatus === 'scheduled' && scheduledAt;
  const showInlineActions = calendarOpened && calendarStatus === 'not_added' && !completed;
  const showCalendarButtons = showCalendarButton && !isLocked && !completed && calendarStatus === 'not_added' && !calendarOpened && suggestedDate;

  return (
    <div
      className={cn(
        "rounded-xl glass-subtle transition-all duration-200",
        isLocked && "opacity-60 cursor-not-allowed",
        !isLocked && "touch-press"
      )}
    >
      <div 
        className={cn(
          "flex items-start gap-4 p-4 sm:p-4 cursor-pointer group select-none",
          completed && "task-completed"
        )}
        onClick={handleClick}
      >
        {/* Touch-friendly checkbox wrapper */}
        <div 
          className="relative flex items-center justify-center touch-checkbox"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked) onToggle();
          }}
        >
          {isLocked ? (
            <div className="h-6 w-6 rounded-md border-2 border-muted-foreground/30 flex items-center justify-center bg-muted/30">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
          ) : (
            <Checkbox
              checked={completed}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "h-6 w-6 rounded-md border-2 checkbox-fill",
                completed 
                  ? "border-primary bg-primary data-[state=checked]:bg-primary" 
                  : "border-muted-foreground/40 hover:border-primary/60"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-foreground task-title transition-all duration-200",
            completed && "line-through text-muted-foreground",
            isLocked && "text-muted-foreground"
          )}>
            {title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs transition-opacity duration-200",
                getPriorityColor(priority),
                (completed || isLocked) && "opacity-50"
              )}
            >
              {priority}
            </Badge>
            <span className={cn(
              "text-xs text-muted-foreground flex items-center gap-1 transition-opacity duration-200",
              (completed || isLocked) && "opacity-50"
            )}>
              <Clock className="w-3 h-3" />
              {estimatedHours}h
            </span>
            
            {/* Show warning for tasks without explanations */}
            {details.needsRegeneration && !isLocked && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Needs guidance</span>
              </span>
            )}
            
            {/* Expand button for tasks with details - touch optimized */}
            {details.hasDetails && (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }}
                    className={cn(
                      "text-xs text-primary flex items-center gap-1.5 py-1.5 px-2 -mx-2 rounded-md transition-colors active:bg-primary/10",
                      (completed || isLocked) && "opacity-50"
                    )}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>How to do this</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} />
                  </button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            
            {/* Scheduled badge - shows when task is confirmed scheduled */}
            {showScheduledBadge && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{format(new Date(scheduledAt!), 'EEE, MMM d')}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddAgain}
                  className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted/50"
                  title="Remove and add again"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            
            {/* Inline actions - shown after user opens calendar */}
            {showInlineActions && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkAsScheduled}
                  className="h-8 px-3 text-xs gradient-kaamyab hover:opacity-90"
                >
                  <CalendarCheck className="w-4 h-4 mr-1.5" />
                  Mark as scheduled
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCalendar();
                  }}
                  className="h-8 px-2 text-xs"
                  title="Open calendar again"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Calendar buttons - only show when not_added and not opened yet */}
            {showCalendarButtons && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {/* Quick add with suggested date */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickAdd}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10 min-h-[36px] hidden sm:flex"
                  title={`Quick add for ${format(suggestedDate!, 'EEEE, MMMM d')} at 9:00 AM`}
                >
                  <CalendarPlus className="w-4 h-4 mr-1" />
                  {format(suggestedDate!, 'MMM d')}
                </Button>
                
                {/* Custom date picker popover */}
                <Popover open={calendarPopoverOpen} onOpenChange={setCalendarPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs border-primary/30 hover:bg-primary/5 active:bg-primary/10 min-h-[36px]"
                    >
                      <CalendarPlus className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Pick date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 space-y-3">
                      <div className="text-sm font-medium text-foreground">
                        Schedule: {title.slice(0, 30)}{title.length > 30 ? '...' : ''}
                      </div>
                      
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="rounded-md border pointer-events-auto"
                      />
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Select value={selectedHour} onValueChange={setSelectedHour}>
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="z-[60]">
                            {timeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setCalendarPopoverOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={handleCustomDateAdd}
                          disabled={!selectedDate}
                        >
                          <CalendarPlus className="w-4 h-4 mr-1.5" />
                          {isAppleDevice() ? 'Add to Apple' : 'Add to Calendar'}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expandable Details Section */}
      {details.hasDetails && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <div className={cn(
              "px-4 pb-4 space-y-3 border-t border-border/30 mx-4 mb-4 pt-3",
              (completed || isLocked) && "opacity-60"
            )}>
              {details.how && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base">🔧</span>
                    <span>How to do it</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.how}</p>
                </div>
              )}
              
              {details.why && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Why it matters</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.why}</p>
                </div>
              )}
              
              {details.expectedOutcome && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Expected outcome</span>
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-5">{details.expectedOutcome}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Fallback UI for tasks without explanations */}
      {details.needsRegeneration && !isLocked && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This task lacks guidance. Regenerate your plan for detailed steps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
