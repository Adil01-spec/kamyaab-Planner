import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, HelpCircle, Users, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ScenarioTag, SCENARIO_OPTIONS } from '@/lib/scenarioMemory';

interface ScenarioTagSelectorProps {
  selected: ScenarioTag;
  onSelect: (tag: ScenarioTag) => void;
  onSkip: () => void;
}

const iconMap = {
  CheckCircle,
  Zap,
  HelpCircle,
  Users,
  BookOpen,
};

export function ScenarioTagSelector({ selected, onSelect, onSkip }: ScenarioTagSelectorProps) {
  const handleSelect = (tag: ScenarioTag) => {
    onSelect(tag);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-foreground">
          What's the context for this plan?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — helps interpret your progress fairly
        </p>
      </div>

      <div className="grid gap-3">
        {SCENARIO_OPTIONS.map((option, index) => {
          const Icon = iconMap[option.icon];
          const isSelected = selected === option.value;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group",
                "hover:border-primary/50 hover:bg-accent/5",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border/50 bg-background/50"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <CheckCircle className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Skip button - always visible */}
      <div className="flex justify-end pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
