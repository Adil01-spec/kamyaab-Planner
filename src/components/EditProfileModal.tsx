import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRESET_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
];

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, profile, saveProfile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userInitials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  useEffect(() => {
    if (open && profile) {
      setFullName(profile.fullName || '');
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [open, profile]);

  const saveAvatarUrl = async (url: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);
    if (error) throw error;
    setAvatarPreview(url);
    await refreshProfile();
  };

  const handlePresetSelect = async (presetUrl: string) => {
    setUploading(true);
    try {
      await saveAvatarUrl(presetUrl);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to set avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await saveAvatarUrl(avatarUrl);
      toast.success('Avatar uploaded');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }
    if (trimmed.length > 100) {
      toast.error('Name must be less than 100 characters');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        fullName: trimmed,
        profession: profile?.profession || '',
        professionDetails: profile?.professionDetails || {},
        projectTitle: profile?.projectTitle || '',
        projectDescription: profile?.projectDescription || '',
        projectDeadline: profile?.projectDeadline || '',
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
      <DialogContent className="sm:max-w-sm bg-card border-border/30">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Current Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                ) : (
                  <Camera className="w-5 h-5 text-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Or choose an avatar</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {PRESET_AVATARS.map((src) => (
                <button
                  key={src}
                  type="button"
                  disabled={uploading}
                  onClick={() => handlePresetSelect(src)}
                  className={cn(
                    "rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    avatarPreview === src && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={src} alt="Preset avatar" />
                  </Avatar>
                </button>
              ))}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full h-10 w-10 flex items-center justify-center border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm text-foreground/80">Full Name</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              maxLength={100}
              className="bg-background/50"
            />
          </div>

          <div className="flex gap-3 pt-1">
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
              disabled={saving || uploading}
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
