import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Globe, Smartphone, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAppleDevice, isAndroidDevice } from '@/lib/calendarService';

export type CalendarTarget = 'in_app' | 'google' | 'apple' | 'device';

interface CalendarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (target: CalendarTarget) => void;
}

const getStoredPreference = (): CalendarTarget | null => {
  try {
    return localStorage.getItem('calendar_preference') as CalendarTarget | null;
  } catch {
    return null;
  }
};

export const setCalendarPreference = (target: CalendarTarget) => {
  try {
    localStorage.setItem('calendar_preference', target);
  } catch {}
};

export const getCalendarPreference = getStoredPreference;

export function CalendarSelectionModal({ open, onOpenChange, onSelect }: CalendarSelectionModalProps) {
  const isIOS = isAppleDevice();
  const isAndroid = isAndroidDevice();

  const handleSelect = (target: CalendarTarget) => {
    setCalendarPreference(target);
    onSelect(target);
    onOpenChange(false);
  };

  const options: { id: CalendarTarget; label: string; desc: string; icon: React.ElementType; show: boolean; recommended?: boolean }[] = [
    {
      id: 'in_app',
      label: 'In-App Calendar',
      desc: 'Reliable reminders, works everywhere',
      icon: Calendar,
      show: true,
      recommended: isAndroid,
    },
    {
      id: 'google',
      label: 'Google Calendar',
      desc: 'Opens Google Calendar with pre-filled event',
      icon: Globe,
      show: true,
    },
    {
      id: 'apple',
      label: 'Apple Calendar',
      desc: 'Download .ics file for Apple Calendar',
      icon: Smartphone,
      show: isIOS,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule this task</DialogTitle>
          <DialogDescription>Where would you like to add this event?</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {options.filter(o => o.show).map((opt) => {
            const Icon = opt.icon;
            return (
              <Button
                key={opt.id}
                variant="outline"
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "w-full justify-start h-auto py-3 px-4 text-left relative",
                  opt.recommended && "border-primary/40 bg-primary/5"
                )}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{opt.label}</span>
                    {opt.recommended && (
                      <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" /> Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
