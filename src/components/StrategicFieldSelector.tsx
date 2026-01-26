import { motion } from 'framer-motion';
import { 
  Code, 
  TrendingUp, 
  Settings, 
  Target, 
  Crown, 
  MoreHorizontal,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STRATEGIC_FIELDS, type StrategicField } from '@/lib/strategicDiscovery';

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  TrendingUp,
  Settings,
  Target,
  Crown,
  MoreHorizontal,
};

interface StrategicFieldSelectorProps {
  onSelect: (field: StrategicField) => void;
  onSkip: () => void;
}

export function StrategicFieldSelector({ onSelect, onSkip }: StrategicFieldSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          What area is this plan for?
        </h2>
        <p className="text-sm text-muted-foreground">
          This helps us ask the right questions. Optional — you can skip anytime.
        </p>
      </div>

      {/* Field Grid */}
      <div className="grid grid-cols-2 gap-3">
        {STRATEGIC_FIELDS.map((field, index) => {
          const IconComponent = ICON_MAP[field.icon] || MoreHorizontal;
          
          return (
            <motion.button
              key={field.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(field.value)}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {field.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Skip Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip discovery
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export default StrategicFieldSelector;
