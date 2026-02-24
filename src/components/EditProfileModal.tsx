import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { profile, saveProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    profession: '',
    projectTitle: '',
    projectDescription: '',
    projectDeadline: '',
  });

  useEffect(() => {
    if (open && profile) {
      setForm({
        fullName: profile.fullName || '',
        profession: profile.profession || '',
        projectTitle: profile.projectTitle || '',
        projectDescription: profile.projectDescription || '',
        projectDeadline: profile.projectDeadline || '',
      });
    }
  }, [open, profile]);

  const handleSave = async () => {
    const trimmedName = form.fullName.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('Name must be less than 100 characters');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        fullName: trimmedName,
        profession: form.profession.trim().slice(0, 100),
        professionDetails: profile?.professionDetails || {},
        projectTitle: form.projectTitle.trim().slice(0, 200),
        projectDescription: form.projectDescription.trim().slice(0, 1000),
        projectDeadline: form.projectDeadline,
      });
      toast.success('Profile updated');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/30">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm text-foreground/80">Full Name</Label>
            <Input
              id="edit-name"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              maxLength={100}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-profession" className="text-sm text-foreground/80">Profession</Label>
            <Input
              id="edit-profession"
              value={form.profession}
              onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
              maxLength={100}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-title" className="text-sm text-foreground/80">Project Title</Label>
            <Input
              id="edit-project-title"
              value={form.projectTitle}
              onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))}
              maxLength={200}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-desc" className="text-sm text-foreground/80">Project Description</Label>
            <Textarea
              id="edit-project-desc"
              value={form.projectDescription}
              onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
              maxLength={1000}
              rows={3}
              className="bg-background/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-deadline" className="text-sm text-foreground/80">Project Deadline</Label>
            <Input
              id="edit-deadline"
              type="date"
              value={form.projectDeadline}
              onChange={e => setForm(f => ({ ...f, projectDeadline: e.target.value }))}
              className="bg-background/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
