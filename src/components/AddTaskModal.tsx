import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Plus, Loader2 } from 'lucide-react';
import { NewTask } from '@/hooks/useTaskMutations';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekNumber: number;
  onAddTask: (task: NewTask) => Promise<boolean>;
}

export function AddTaskModal({
  open,
  onOpenChange,
  weekNumber,
  onAddTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setEstimatedHours(2);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setSubmitting(true);
    const success = await onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      estimated_hours: estimatedHours,
    });

    if (success) {
      resetForm();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Task to Week {weekNumber}
          </DialogTitle>
          <DialogDescription>
            Create a new task that will be added to this week's plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Additional details or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={(v) => setPriority(v as 'High' | 'Medium' | 'Low')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="High" id="priority-high" />
                <Label
                  htmlFor="priority-high"
                  className="font-normal cursor-pointer text-destructive"
                >
                  High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medium" id="priority-medium" />
                <Label
                  htmlFor="priority-medium"
                  className="font-normal cursor-pointer text-primary"
                >
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Low" id="priority-low" />
                <Label
                  htmlFor="priority-low"
                  className="font-normal cursor-pointer text-muted-foreground"
                >
                  Low
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Estimated Hours</Label>
              <span className="text-sm font-medium text-primary">{estimatedHours}h</span>
            </div>
            <Slider
              value={[estimatedHours]}
              onValueChange={([v]) => setEstimatedHours(v)}
              min={0.5}
              max={16}
              step={0.5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30min</span>
              <span>16h</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
