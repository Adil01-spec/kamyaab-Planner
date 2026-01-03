import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Vibrate, 
  Volume2, 
  Layers, 
  Wind, 
  Smartphone, 
  Hand,
  RotateCcw
} from "lucide-react";
import type { MobileSettings } from "@/hooks/useMobileSettings";

interface MobileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MobileSettings;
  onToggle: (key: keyof MobileSettings) => void;
  onReset: () => void;
}

const settingsConfig: {
  key: keyof MobileSettings;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  resourceIntensive: boolean;
}[] = [
  {
    key: 'hapticFeedback',
    label: 'Haptic Feedback',
    description: 'Vibrations on task completion',
    icon: Vibrate,
    resourceIntensive: false,
  },
  {
    key: 'audioFeedback',
    label: 'Sound Effects',
    description: 'Celebration sounds on actions',
    icon: Volume2,
    resourceIntensive: true,
  },
  {
    key: 'parallaxEffects',
    label: 'Parallax Effects',
    description: 'Motion-based UI depth',
    icon: Layers,
    resourceIntensive: true,
  },
  {
    key: 'breathingAnimation',
    label: 'Breathing Animation',
    description: 'Subtle ambient background motion',
    icon: Wind,
    resourceIntensive: true,
  },
  {
    key: 'deviceMotion',
    label: 'Device Motion',
    description: 'Tilt-based interactions',
    icon: Smartphone,
    resourceIntensive: true,
  },
  {
    key: 'swipeNavigation',
    label: 'Swipe Navigation',
    description: 'Swipe to navigate between pages',
    icon: Hand,
    resourceIntensive: false,
  },
];

export function MobileSettingsDialog({
  open,
  onOpenChange,
  settings,
  onToggle,
  onReset,
}: MobileSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-card/95 backdrop-blur-xl border-border/30">
        <DialogHeader>
          <DialogTitle className="text-foreground">Mobile Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground/70">
            Toggle features to optimize performance on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {settingsConfig.map(({ key, label, description, icon: Icon, resourceIntensive }) => (
            <div 
              key={key}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-background/50 border border-border/10"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <Label 
                    htmlFor={key} 
                    className="text-sm font-medium text-foreground/90 flex items-center gap-1.5"
                  >
                    {label}
                    {resourceIntensive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500/80">
                        GPU
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground/60 truncate">
                    {description}
                  </p>
                </div>
              </div>
              <Switch
                id={key}
                checked={settings[key]}
                onCheckedChange={() => onToggle(key)}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <p className="text-[11px] text-muted-foreground/50">
            Resource-intensive features are off by default
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
