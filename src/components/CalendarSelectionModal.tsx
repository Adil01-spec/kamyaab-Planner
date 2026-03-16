import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, Loader2, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { type PreferredCalendar, fetchPreferredCalendar, CALENDAR_LABELS } from '@/utils/calendarRouter';
import type { TaskCalendarEvent } from '@/hooks/useTaskCalendarEvents';

export type CalendarTarget = 'in_app' | 'google' | 'apple' | 'device';

export interface CalendarScheduleData {
  date: Date;
  startHour: number;
  durationHours: number;
  reminderMinutes: number;
  /** Which calendar to route to (override or user default) */
  calendarTarget: PreferredCalendar;
}

interface CalendarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CalendarScheduleData) => void;
  defaultDate?: Date;
  existingEvent?: TaskCalendarEvent | null;
  taskTitle?: string;
  estimatedHours?: number;
  isSaving?: boolean;
}

export const getCalendarPreference = (): CalendarTarget | null => {
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

const timeOptions = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 5;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return { value: hour.toString(), label: `${h12}:00 ${ampm}` };
});

const durationOptions = [
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
];

const reminderOptions = [
  { value: '0', label: 'No reminder' },
  { value: '5', label: '5 min before' },
  { value: '10', label: '10 min before' },
  { value: '15', label: '15 min before' },
  { value: '30', label: '30 min before' },
  { value: '60', label: '1 hour before' },
];

const calendarOptions: { value: PreferredCalendar; label: string }[] = [
  { value: 'kamyaab', label: 'Kamyaab Calendar' },
  { value: 'google', label: 'Google Calendar' },
  { value: 'apple', label: 'Apple Calendar' },
];

export function CalendarSelectionModal({
  open,
  onOpenChange,
  onSave,
  defaultDate,
  existingEvent,
  taskTitle,
  estimatedHours = 1,
  isSaving = false,
}: CalendarSelectionModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState('9');
  const [durationHours, setDurationHours] = useState('1');
  const [reminderMinutes, setReminderMinutes] = useState('10');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [calendarTarget, setCalendarTarget] = useState<PreferredCalendar>('kamyaab');
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Load user's preferred calendar
    if (user?.id) {
      fetchPreferredCalendar(user.id).then(pref => setCalendarTarget(pref));
    }

    if (existingEvent) {
      const start = new Date(existingEvent.start_time);
      setSelectedDate(start);
      setStartHour(start.getHours().toString());
      if (existingEvent.end_time) {
        const end = new Date(existingEvent.end_time);
        const dur = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
        setDurationHours(Math.min(dur, 4).toString());
      } else {
        setDurationHours(Math.min(estimatedHours, 4).toString());
      }
      setReminderMinutes('10');
    } else {
      const fallback = defaultDate || new Date();
      setSelectedDate(fallback);
      setStartHour(fallback.getHours() >= 5 && fallback.getHours() <= 22 ? fallback.getHours().toString() : '9');
      setDurationHours(Math.min(Math.max(1, estimatedHours), 4).toString());
      setReminderMinutes('10');
    }
    setValidationError(null);
    setShowCalendarPicker(false);
  }, [open]);

  const handleSave = () => {
    if (!selectedDate) {
      setValidationError('Please select a date.');
      return;
    }

    const now = new Date();
    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(startHour), 0, 0, 0);

    if (startTime < now && startTime.toDateString() === now.toDateString()) {
      if (startTime.getTime() < now.getTime()) {
        setValidationError('Selected time is in the past. Choose a later time.');
        return;
      }
    } else if (startTime < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      setValidationError('Cannot schedule in the past.');
      return;
    }

    setValidationError(null);
    onSave({
      date: selectedDate,
      startHour: parseInt(startHour),
      durationHours: parseInt(durationHours),
      reminderMinutes: parseInt(reminderMinutes),
      calendarTarget,
    });
  };

  const isReschedule = !!existingEvent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isReschedule ? 'Reschedule Task' : 'Schedule Task'}</DialogTitle>
          {taskTitle && (
            <DialogDescription className="truncate">
              {taskTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Calendar indicator + override */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Calendar: <span className="font-medium text-foreground">{CALENDAR_LABELS[calendarTarget]}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCalendarPicker(!showCalendarPicker)}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              Change <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {showCalendarPicker && (
            <div className="grid grid-cols-3 gap-2">
              {calendarOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setCalendarTarget(opt.value); setShowCalendarPicker(false); }}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                    calendarTarget === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setValidationError(null); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Start Time
              </Label>
              <Select value={startHour} onValueChange={(v) => { setStartHour(v); setValidationError(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={durationHours} onValueChange={setDurationHours}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reminder — only for Kamyaab calendar */}
          {calendarTarget === 'kamyaab' && (
            <div className="space-y-1.5">
              <Label>Reminder</Label>
              <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hint */}
          {!isReschedule && defaultDate && (
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Suggested based on plan structure. You can change this.
            </p>
          )}

          {validationError && (
            <p className="text-xs text-destructive font-medium">{validationError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!selectedDate || isSaving}
              className="gradient-kaamyab hover:opacity-90"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isReschedule ? 'Reschedule' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
