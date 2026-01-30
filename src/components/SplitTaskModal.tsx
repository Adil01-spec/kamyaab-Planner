import { useState, useEffect } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Scissors, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  [key: string]: any;
}

interface SplitTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSplit: (
    task1: { title: string; estimated_hours: number },
    task2: { title: string; estimated_hours: number }
  ) => Promise<boolean>;
}

export function SplitTaskModal({
  open,
  onOpenChange,
  task,
  onSplit,
}: SplitTaskModalProps) {
  const [title1, setTitle1] = useState('');
  const [title2, setTitle2] = useState('');
  const [splitPercent, setSplitPercent] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle1(`${task.title} (Part 1)`);
      setTitle2(`${task.title} (Part 2)`);
      setSplitPercent(50);
    }
  }, [task]);

  if (!task) return null;

  const totalHours = task.estimated_hours;
  const hours1 = Math.round((splitPercent / 100) * totalHours * 10) / 10;
  const hours2 = Math.round(((100 - splitPercent) / 100) * totalHours * 10) / 10;

  const handleSubmit = async () => {
    if (!title1.trim() || !title2.trim()) return;

    setSubmitting(true);
    const success = await onSplit(
      { title: title1.trim(), estimated_hours: hours1 },
      { title: title2.trim(), estimated_hours: hours2 }
    );

    if (success) {
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Split Task
          </DialogTitle>
          <DialogDescription>
            Divide this task into two separate tasks with allocated time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Original Task Reference */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{task.title}</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    task.priority === 'High'
                      ? 'border-destructive/50 text-destructive'
                      : task.priority === 'Medium'
                      ? 'border-primary/50 text-primary'
                      : ''
                  )}
                >
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {totalHours}h total
                </span>
              </div>
            </div>
          </div>

          {/* Split Allocation Slider */}
          <div className="space-y-3">
            <Label>Time Allocation</Label>
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-medium">{hours1}h</span>
              <span className="text-muted-foreground">←  {splitPercent}% | {100 - splitPercent}%  →</span>
              <span className="text-primary font-medium">{hours2}h</span>
            </div>
            <Slider
              value={[splitPercent]}
              onValueChange={([v]) => setSplitPercent(v)}
              min={10}
              max={90}
              step={5}
              className="py-2"
            />
          </div>

          {/* Task 1 */}
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="title1" className="text-primary">Task 1</Label>
              <Badge variant="outline" className="text-xs">
                {hours1}h
              </Badge>
            </div>
            <Input
              id="title1"
              value={title1}
              onChange={(e) => setTitle1(e.target.value)}
              placeholder="First task title"
              maxLength={150}
            />
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
          </div>

          {/* Task 2 */}
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="title2" className="text-primary">Task 2</Label>
              <Badge variant="outline" className="text-xs">
                {hours2}h
              </Badge>
            </div>
            <Input
              id="title2"
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              placeholder="Second task title"
              maxLength={150}
            />
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            Both tasks will inherit the original priority ({task.priority}) and start as pending.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title1.trim() || !title2.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Splitting...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Split Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
