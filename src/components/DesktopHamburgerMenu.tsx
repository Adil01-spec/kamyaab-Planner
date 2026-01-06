import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Menu,
  Home,
  Calendar,
  CalendarDays,
  Rocket,
  Settings,
  MousePointer2,
  Layers,
  Wind,
  Sparkles,
  Zap,
  Palette,
  Circle,
  Hexagon,
  Waves,
  Sun,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import type { DesktopSettings, BackgroundPattern } from '@/hooks/useDesktopSettings';

interface DesktopHamburgerMenuProps {
  settings: DesktopSettings;
  onToggle: (key: 'cursorEffects' | 'parallaxEffects' | 'breathingAnimation' | 'hoverAnimations' | 'performanceMode' | 'dynamicBackground') => void;
  onUpdateSettings: (updates: Partial<DesktopSettings>) => void;
  onReset: () => void;
}

type BooleanSettingKey = 'cursorEffects' | 'parallaxEffects' | 'breathingAnimation' | 'hoverAnimations' | 'dynamicBackground';

const settingsConfig: {
  key: BooleanSettingKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'dynamicBackground', label: 'Dynamic Background', icon: Palette },
  { key: 'cursorEffects', label: 'Cursor Effects', icon: MousePointer2 },
  { key: 'parallaxEffects', label: 'Parallax Effects', icon: Layers },
  { key: 'breathingAnimation', label: 'Breathing Animation', icon: Wind },
  { key: 'hoverAnimations', label: 'Hover Animations', icon: Sparkles },
];

const patternOptions: { value: BackgroundPattern; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'orbs', label: 'Orbs', icon: Circle },
  { value: 'geometric', label: 'Geometric', icon: Hexagon },
  { value: 'waves', label: 'Waves', icon: Waves },
  { value: 'particles', label: 'Particles', icon: Sparkles },
  { value: 'seasonal', label: 'Seasonal', icon: Sun },
];

export function DesktopHamburgerMenu({
  settings,
  onToggle,
  onUpdateSettings,
  onReset,
}: DesktopHamburgerMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Today', path: '/today', icon: CalendarDays },
    { label: 'Full Plan', path: '/plan', icon: Calendar },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex h-9 w-9"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] bg-card/95 backdrop-blur-xl border-border/30 p-0">
        <SheetHeader className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-kaamyab flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <SheetTitle className="text-lg font-semibold text-foreground">Kaamyab</SheetTitle>
          </div>
        </SheetHeader>

        <Separator className="bg-border/20" />

        {/* Navigation Section */}
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map(({ label, path, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <Separator className="bg-border/20 mx-3" />

        {/* Theme Toggle */}
        <div className="p-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-foreground/80">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        <Separator className="bg-border/20 mx-3" />

        {/* Settings Section */}
        <div className="p-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" />
              Desktop Settings
            </div>
            <ChevronRight className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
          </button>

          {showSettings && (
            <div className="mt-2 space-y-2 px-1">
              {/* Performance Mode */}
              <div 
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                  settings.performanceMode 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Zap className={`w-4 h-4 ${settings.performanceMode ? 'text-primary' : 'text-emerald-500'}`} />
                  <div className="min-w-0">
                    <Label htmlFor="perf-mode" className="text-xs font-semibold text-foreground">
                      Performance Mode
                    </Label>
                    <p className="text-[10px] text-muted-foreground/60">
                      {settings.performanceMode ? 'Effects disabled' : 'Effects enabled'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="perf-mode"
                  checked={settings.performanceMode}
                  onCheckedChange={() => onToggle('performanceMode')}
                />
              </div>

              {/* Individual Settings */}
              {settingsConfig.map(({ key, label, icon: Icon }) => (
                <div 
                  key={key}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/10 transition-opacity ${
                    settings.performanceMode ? 'opacity-50' : 'bg-background/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={`menu-${key}`} className="text-xs font-medium text-foreground/80">
                      {label}
                    </Label>
                  </div>
                  <Switch
                    id={`menu-${key}`}
                    checked={settings[key]}
                    onCheckedChange={() => onToggle(key)}
                  />
                </div>
              ))}

              {/* Pattern Selector */}
              {settings.dynamicBackground && (
                <div className="p-2.5 rounded-lg border border-border/10 bg-background/30">
                  <Label className="text-xs font-medium text-foreground/80 block mb-2">
                    Pattern Style
                  </Label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {patternOptions.map(({ value, label, icon: PatternIcon }) => (
                      <button
                        key={value}
                        onClick={() => onUpdateSettings({ backgroundPattern: value })}
                        className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md text-[10px] font-medium transition-colors ${
                          settings.backgroundPattern === value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <PatternIcon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset to Defaults
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
