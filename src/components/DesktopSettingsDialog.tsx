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
  MousePointer2, 
  Layers, 
  Wind, 
  Sparkles,
  RotateCcw,
  Zap,
  Monitor,
  Palette,
  Circle,
  Hexagon,
  Waves,
  Sun
} from "lucide-react";
import type { DesktopSettings, BackgroundPattern } from "@/hooks/useDesktopSettings";

interface DesktopSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: DesktopSettings;
  onToggle: (key: 'cursorEffects' | 'parallaxEffects' | 'breathingAnimation' | 'hoverAnimations' | 'performanceMode' | 'dynamicBackground') => void;
  onUpdateSettings: (updates: Partial<DesktopSettings>) => void;
  onReset: () => void;
}

type BooleanSettingKey = 'cursorEffects' | 'parallaxEffects' | 'breathingAnimation' | 'hoverAnimations' | 'dynamicBackground';

const settingsConfig: {
  key: BooleanSettingKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  resourceIntensive: boolean;
}[] = [
  {
    key: 'dynamicBackground',
    label: 'Dynamic Background',
    description: 'Time-based illustration patterns',
    icon: Palette,
    resourceIntensive: true,
  },
  {
    key: 'cursorEffects',
    label: 'Cursor Effects',
    description: 'Flying cursors on button hover',
    icon: MousePointer2,
    resourceIntensive: true,
  },
  {
    key: 'parallaxEffects',
    label: 'Parallax Effects',
    description: 'Mouse-following depth effects',
    icon: Layers,
    resourceIntensive: true,
  },
  {
    key: 'breathingAnimation',
    label: 'Breathing Animation',
    description: 'Ambient background motion',
    icon: Wind,
    resourceIntensive: true,
  },
  {
    key: 'hoverAnimations',
    label: 'Hover Animations',
    description: 'Card lift and glow effects',
    icon: Sparkles,
    resourceIntensive: true,
  },
];

const patternOptions: { value: BackgroundPattern; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'orbs', label: 'Orbs', icon: Circle },
  { value: 'geometric', label: 'Geometric', icon: Hexagon },
  { value: 'waves', label: 'Waves', icon: Waves },
  { value: 'particles', label: 'Particles', icon: Sparkles },
  { value: 'seasonal', label: 'Seasonal', icon: Sun },
];

export function DesktopSettingsDialog({
  open,
  onOpenChange,
  settings,
  onToggle,
  onUpdateSettings,
  onReset,
}: DesktopSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-border/30">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <DialogTitle className="text-foreground">Desktop Settings</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground/70">
            Toggle visual effects to optimize performance.
          </DialogDescription>
        </DialogHeader>

        {/* Performance Mode Toggle - Prominent at top */}
        <div 
          className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
            settings.performanceMode 
              ? 'bg-primary/10 border-primary/20' 
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              settings.performanceMode ? 'bg-primary/20' : 'bg-emerald-500/20'
            }`}>
              <Zap className={`w-5 h-5 ${
                settings.performanceMode ? 'text-primary' : 'text-emerald-500'
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
                  ? 'All effects disabled for speed' 
                  : 'Full visual effects enabled'
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
            Visual Effects
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500/80">
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

          {/* Background Pattern Selector */}
          {settings.dynamicBackground && (
            <div className="p-3 rounded-lg border border-border/10 bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-foreground/90">
                  Pattern Style
                </Label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {patternOptions.map(({ value, label, icon: PatternIcon }) => (
                  <button
                    key={value}
                    onClick={() => onUpdateSettings({ backgroundPattern: value })}
                    className={`flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.backgroundPattern === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <PatternIcon className="w-4 h-4" />
                    <span className="text-[10px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <p className="text-[11px] text-muted-foreground/50">
            Effects enabled by default on desktop
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
