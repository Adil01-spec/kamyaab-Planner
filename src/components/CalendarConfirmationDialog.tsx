import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarCheck, CalendarX, Clock } from 'lucide-react';
import { playCalendarConfirmSound, playCalendarRetrySound } from '@/lib/celebrationSound';
import { hapticSuccess, hapticWarning } from '@/lib/hapticFeedback';

interface CalendarConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string;
  onConfirm: () => void;
  onDeny: () => void;
  onRemindLater: () => void;
}

export function CalendarConfirmationDialog({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
  onDeny,
  onRemindLater,
}: CalendarConfirmationDialogProps) {
  const handleConfirm = () => {
    console.log('CONFIRM YES CLICKED - CalendarConfirmationDialog');
    hapticSuccess();
    playCalendarConfirmSound();
    onConfirm();
  };
  
  const handleDeny = () => {
    console.log('CONFIRM NO CLICKED - CalendarConfirmationDialog');
    hapticWarning();
    playCalendarRetrySound();
    onDeny();
  };
  
  const handleRemindLater = () => {
    console.log('REMIND LATER CLICKED - CalendarConfirmationDialog');
    onRemindLater();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Did you add this task to your calendar?
          </DialogTitle>
          <DialogDescription className="pt-2">
            We opened your calendar earlier. Did you finish adding this task?
            {taskTitle && (
              <span className="block mt-2 font-medium text-foreground">
                "{taskTitle}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleConfirm}
            className="w-full gradient-kaamyab hover:opacity-90"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Yes, it's added
          </Button>
          <Button
            variant="outline"
            onClick={handleDeny}
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <CalendarX className="w-4 h-4 mr-2" />
            No, add it again
          </Button>
          <Button
            variant="ghost"
            onClick={handleRemindLater}
            className="w-full text-muted-foreground"
          >
            <Clock className="w-4 h-4 mr-2" />
            Remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
