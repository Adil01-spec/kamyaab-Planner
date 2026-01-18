import { useState } from 'react';
import { useDevMode } from '@/contexts/DevModeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface DevModeActivatorProps {
  /** Number of taps/clicks required to trigger the activator */
  triggerCount?: number;
  /** Children to wrap - typically a logo or icon */
  children: React.ReactNode;
}

export function DevModeActivator({ triggerCount = 5, children }: DevModeActivatorProps) {
  const { isDevMode, isAllowedUser, activateDevMode, showActivator, setShowActivator } = useDevMode();
  const [tapCount, setTapCount] = useState(0);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Don't show activator controls if already in dev mode or in development
  if (isDevMode || import.meta.env.DEV) {
    return <>{children}</>;
  }

  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Reset after 2 seconds of inactivity
    setTimeout(() => {
      setTapCount(prev => (prev === newCount ? 0 : prev));
    }, 2000);

    if (newCount >= triggerCount) {
      setTapCount(0);
      if (isAllowedUser) {
        setShowActivator(true);
      }
      // Silently fail for non-allowed users (no indication dev mode exists)
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const activated = activateDevMode(code);
    if (activated) {
      setSuccess(true);
      setTimeout(() => {
        setShowActivator(false);
        setCode('');
        setSuccess(false);
      }, 1500);
    } else {
      setError('Invalid activation code');
      setCode('');
    }
  };

  return (
    <>
      <div onClick={handleTap} className="cursor-pointer">
        {children}
      </div>

      <Dialog open={showActivator} onOpenChange={setShowActivator}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Developer Mode
            </DialogTitle>
            <DialogDescription>
              Enter the activation code to enable debug panels.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium text-green-600">
                Dev mode activated!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dev-code">Activation Code</Label>
                <Input
                  id="dev-code"
                  type="password"
                  placeholder="Enter code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowActivator(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!code.trim()}>
                  Activate
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
