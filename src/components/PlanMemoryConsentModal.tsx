// Consent modal for storing execution patterns for future plan generation

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Brain, Loader2 } from 'lucide-react';

interface PlanMemoryConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => Promise<void>;
  onDecline: () => void;
}

export function PlanMemoryConsentModal({
  open,
  onOpenChange,
  onConsent,
  onDecline,
}: PlanMemoryConsentModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleConsent = async () => {
    setIsSaving(true);
    try {
      await onConsent();
    } finally {
      setIsSaving(false);
      onOpenChange(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Use this experience to improve your next plan?
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            We can analyze your execution patterns to generate a smarter, more realistic plan next time. Only structured metrics are stored — no raw task descriptions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
          <Button
            onClick={handleConsent}
            disabled={isSaving}
            className="w-full gradient-kaamyab hover:opacity-90 h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Yes, use my progress'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDecline}
            disabled={isSaving}
            className="w-full text-muted-foreground h-11"
          >
            No, don't use this
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
