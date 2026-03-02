import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from '@/hooks/useCalendarEvents';

interface CalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultTitle?: string;
  defaultDescription?: string;
  taskRef?: string;
  planId?: string;
  onSave: (input: CreateCalendarEventInput) => void;
  onUpdate?: (input: UpdateCalendarEventInput) => void;
  onDelete?: (eventId: string) => void;
  isSaving?: boolean;
}

const timeOptions = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return { value: hour.toString(), label: `${h12}:00 ${ampm}` };
});

const reminderOptions = [
  { value: '0', label: 'No reminder' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
];

export function CalendarEventModal({
  open,
  onOpenChange,
  event,
  defaultDate,
  defaultTitle = '',
  defaultDescription = '',
  taskRef,
  planId,
  onSave,
  onUpdate,
  onDelete,
  isSaving = false,
}: CalendarEventModalProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [hour, setHour] = useState('9');
  const [durationHours, setDurationHours] = useState('1');
  const [reminderMinutes, setReminderMinutes] = useState('10');

  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        const start = new Date(event.start_time);
        setDate(start);
        setHour(start.getHours().toString());
        if (event.end_time) {
          const end = new Date(event.end_time);
          const dur = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
          setDurationHours(dur.toString());
        }
        setReminderMinutes((event.reminder_minutes ?? 10).toString());
      } else {
        setTitle(defaultTitle);
        setDescription(defaultDescription);
        setDate(defaultDate || new Date());
        setHour('9');
        setDurationHours('1');
        setReminderMinutes('10');
      }
    }
  }, [open, event, defaultDate, defaultTitle, defaultDescription]);

  const handleSubmit = () => {
    if (!title.trim() || !date) return;

    const startTime = new Date(date);
    startTime.setHours(parseInt(hour), 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + parseInt(durationHours));

    if (isEditing && onUpdate && event) {
      onUpdate({
        id: event.id,
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reminder_minutes: parseInt(reminderMinutes),
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reminder_minutes: parseInt(reminderMinutes),
        task_ref: taskRef,
        plan_id: planId,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you working on?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Select value={hour} onValueChange={setHour}>
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
                  {['1', '2', '3', '4'].map((d) => (
                    <SelectItem key={d} value={d}>{d} hour{d !== '1' ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="event-desc">Notes</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {isEditing && onDelete && event && (
              <Button variant="destructive" size="sm" onClick={() => { onDelete(event.id); onOpenChange(false); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || !date || isSaving} className="gradient-kaamyab hover:opacity-90">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
