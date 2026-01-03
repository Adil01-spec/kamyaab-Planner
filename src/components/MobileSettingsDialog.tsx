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
  RotateCcw,
  Zap
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
      <DialogContent className="sm:max-w-[380px] bg-card/95 backdrop-blur-xl border-border/30 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Mobile Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground/70">
            Toggle features to optimize performance on your device.
          </DialogDescription>
        </DialogHeader>

        {/* Performance Mode Toggle - Prominent at top */}
        <div 
          className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
            settings.performanceMode 
              ? 'bg-primary/10 border-primary/20' 
              : 'bg-orange-500/10 border-orange-500/20'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              settings.performanceMode ? 'bg-primary/20' : 'bg-orange-500/20'
            }`}>
              <Zap className={`w-5 h-5 ${
                settings.performanceMode ? 'text-primary' : 'text-orange-500'
              }`} />
            </div>
            <div className="min-w-0">
              <Label 
                htmlFor="performanceMode" 
                className="text-sm font-semibold text-foreground"
              >
                Performance Mode
              </Label>
              <p className="text-xs text-muted-foreground/70">
                {settings.performanceMode 
                  ? 'GPU effects disabled for speed' 
                  : 'Full effects enabled'
                }
              </p>
            </div>
          </div>
          <Switch
            id="performanceMode"
            checked={settings.performanceMode}
            onCheckedChange={() => onToggle('performanceMode')}
          />
        </div>

        <div className="space-y-3 py-2">
          <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-1">
            Individual Features
          </p>
          {settingsConfig.map(({ key, label, description, icon: Icon, resourceIntensive }) => (
            <div 
              key={key}
              className={`flex items-center justify-between gap-4 p-3 rounded-lg border border-border/10 transition-opacity ${
                resourceIntensive && settings.performanceMode ? 'opacity-50' : 'bg-background/50'
              }`}
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
            Performance mode is on by default
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
