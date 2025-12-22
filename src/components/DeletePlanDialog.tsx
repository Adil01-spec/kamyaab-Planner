import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface DeletePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeletePlanDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeletePlanDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Delete current plan?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will permanently remove your current plan. Your profile and preferences will stay safe.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="glass-subtle border-border/50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-press"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
