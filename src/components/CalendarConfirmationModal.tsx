import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { PreferredCalendar, CalendarEventData } from '@/utils/calendarRouter';
import { routeCalendarEvent, CALENDAR_LABELS } from '@/utils/calendarRouter';

interface CalendarConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarTarget: PreferredCalendar;
  eventData: CalendarEventData;
  onConfirmed: () => void;
}

export function CalendarConfirmationModal({
  open,
  onOpenChange,
  calendarTarget,
  eventData,
  onConfirmed,
}: CalendarConfirmationModalProps) {
  const calendarLabel = CALENDAR_LABELS[calendarTarget] || calendarTarget;

  const handleConfirm = () => {
    onConfirmed();
    onOpenChange(false);
  };

  const handleRetry = () => {
    routeCalendarEvent(eventData, calendarTarget);
  };

  const handleClose = (isOpen: boolean) => {
    // If user closes without confirming, event is NOT created
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Confirm Event
          </DialogTitle>
          <DialogDescription>
            Did you add this event to <span className="font-medium text-foreground">{calendarLabel}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            We opened {calendarLabel} for you. Please confirm once you've added the event so we can track it.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirm}
              className="gradient-kaamyab hover:opacity-90 w-full gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Yes, I added it
            </Button>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Open Calendar Again
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            If you close without confirming, the event won't be tracked.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
