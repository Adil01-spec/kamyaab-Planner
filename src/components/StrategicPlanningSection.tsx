import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target, Briefcase, AlertTriangle, Users, Brain, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  StrategicPlanningData,
  STRATEGY_HORIZONS,
  PRIMARY_OBJECTIVES,
  BUSINESS_STAGES,
  CONSTRAINTS,
  DELEGATION_PREFERENCES,
  DECISION_STYLES,
} from '@/lib/executiveDetection';

interface StrategicPlanningSectionProps {
  data: StrategicPlanningData;
  onChange: (data: StrategicPlanningData) => void;
  className?: string;
}

export function StrategicPlanningSection({
  data,
  onChange,
  className = '',
}: StrategicPlanningSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateField = <K extends keyof StrategicPlanningData>(
    field: K,
    value: StrategicPlanningData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const toggleConstraint = (constraint: string) => {
    const current = data.constraints || [];
    const updated = current.includes(constraint)
      ? current.filter((c) => c !== constraint)
      : [...current, constraint];
    updateField('constraints', updated);
  };

  const hasAnyData = () => {
    return (
      data.strategy_horizon ||
      data.primary_objective ||
      data.business_stage ||
      (data.constraints && data.constraints.length > 0) ||
      data.delegation_preference ||
      data.decision_style
    );
  };

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <motion.button
            className="w-full flex items-center justify-between p-4 rounded-xl glass-subtle border border-border/50 hover:border-primary/30 transition-all group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Strategic Context</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plan at an executive level instead of task-only execution
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </motion.button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mt-4 space-y-6 overflow-hidden"
              >
                {/* Strategy Horizon */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Time Horizon</Label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {STRATEGY_HORIZONS.map((horizon) => (
                      <motion.button
                        key={horizon.value}
                        onClick={() => updateField('strategy_horizon', horizon.value as StrategicPlanningData['strategy_horizon'])}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left text-sm ${
                          data.strategy_horizon === horizon.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/30'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <span>{horizon.label}</span>
                        {data.strategy_horizon === horizon.value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Primary Objective */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Primary Objective</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRIMARY_OBJECTIVES.map((objective) => (
                      <motion.button
                        key={objective}
                        onClick={() => updateField('primary_objective', objective)}
                        className={`p-3 rounded-lg border transition-all text-left text-sm ${
                          data.primary_objective === objective
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {objective}
                      </motion.button>
                    ))}
                  </div>
                  {data.primary_objective === 'Other' && (
                    <Input
                      placeholder="Describe your primary objective..."
                      value={data.primary_objective_other || ''}
                      onChange={(e) => updateField('primary_objective_other', e.target.value)}
                      className="h-10 glass-subtle border-border/50"
                    />
                  )}
                </div>

                {/* Business Stage */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Business Stage</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_STAGES.map((stage) => (
                      <motion.button
                        key={stage}
                        onClick={() => updateField('business_stage', stage)}
                        className={`p-3 rounded-lg border transition-all text-left text-sm ${
                          data.business_stage === stage
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {stage}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Biggest Constraints</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CONSTRAINTS.map((constraint) => {
                      const isSelected = (data.constraints || []).includes(constraint);
                      return (
                        <motion.button
                          key={constraint}
                          onClick={() => toggleConstraint(constraint)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-accent'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {constraint}
                        </motion.button>
                      );
                    })}
                  </div>
                  <Input
                    placeholder="Other constraints (optional)..."
                    value={data.constraints_other || ''}
                    onChange={(e) => updateField('constraints_other', e.target.value)}
                    className="h-10 glass-subtle border-border/50"
                  />
                </div>

                {/* Delegation Preference */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Delegation Level</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DELEGATION_PREFERENCES.map((pref) => (
                      <motion.button
                        key={pref}
                        onClick={() => updateField('delegation_preference', pref)}
                        className={`p-3 rounded-lg border transition-all text-left text-sm ${
                          data.delegation_preference === pref
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {pref}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Decision Style */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Decision Style</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DECISION_STYLES.map((style) => (
                      <motion.button
                        key={style}
                        onClick={() => updateField('decision_style', style)}
                        className={`p-3 rounded-lg border transition-all text-left text-sm ${
                          data.decision_style === style
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:border-primary/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {style}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Skip Notice */}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  All fields are optional — skip to continue with standard planning
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>

      {/* Show summary if collapsed but has data */}
      {!isOpen && hasAnyData() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex flex-wrap gap-1"
        >
          {data.strategy_horizon && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {STRATEGY_HORIZONS.find((h) => h.value === data.strategy_horizon)?.label.split(' ')[0]}
            </span>
          )}
          {data.primary_objective && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {data.primary_objective === 'Other' ? data.primary_objective_other : data.primary_objective}
            </span>
          )}
          {data.delegation_preference && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
              {data.delegation_preference.split(' ')[0]}
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
