import { motion } from 'framer-motion';
import { User, Users, Clock, AlertTriangle, Trophy, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  StrategicPlanContext,
  SENIORITY_LEVELS,
  PLANNING_SCOPES,
  TIME_HORIZONS,
  RISK_TOLERANCES,
} from '@/lib/executiveDetection';

interface StrategicPlanningStepsProps {
  currentStep: number; // 1-5 for the strategic steps
  data: StrategicPlanContext;
  onChange: (data: StrategicPlanContext) => void;
}

export function StrategicPlanningSteps({ currentStep, data, onChange }: StrategicPlanningStepsProps) {
  const updateField = <K extends keyof StrategicPlanContext>(
    field: K,
    value: StrategicPlanContext[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const toggleScope = (scope: 'personal' | 'team' | 'department' | 'company') => {
    const current = data.planning_scope || [];
    const updated = current.includes(scope)
      ? current.filter((s) => s !== scope)
      : [...current, scope];
    updateField('planning_scope', updated);
  };

  const updateConstraint = <K extends keyof NonNullable<StrategicPlanContext['constraints']>>(
    field: K,
    value: NonNullable<StrategicPlanContext['constraints']>[K]
  ) => {
    onChange({
      ...data,
      constraints: { ...data.constraints, [field]: value },
    });
  };

  // Step 1: Seniority Level
  if (currentStep === 1) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">What best describes your role?</h2>
          <p className="text-muted-foreground text-sm mt-1">This is optional — skip if you prefer</p>
        </div>

        <div className="grid gap-2">
          {SENIORITY_LEVELS.map((level) => (
            <motion.button
              key={level.value}
              onClick={() => updateField('planning_seniority', level.value)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                data.planning_seniority === level.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-primary/30'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="font-medium">{level.label}</span>
              {data.planning_seniority === level.value && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Planning Scope (multi-select)
  if (currentStep === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">What is the scope of this plan?</h2>
          <p className="text-muted-foreground text-sm mt-1">Select all that apply (optional)</p>
        </div>

        <div className="grid gap-2">
          {PLANNING_SCOPES.map((scope) => {
            const isSelected = (data.planning_scope || []).includes(scope.value);
            return (
              <motion.button
                key={scope.value}
                onClick={() => toggleScope(scope.value)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/30'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="font-medium">{scope.label}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 3: Time Horizon
  if (currentStep === 3) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">What time horizon are you planning for?</h2>
          <p className="text-muted-foreground text-sm mt-1">Optional — helps tailor your plan</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TIME_HORIZONS.map((horizon) => (
            <motion.button
              key={horizon.value}
              onClick={() => updateField('time_horizon', horizon.value)}
              className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                data.time_horizon === horizon.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 hover:border-primary/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{horizon.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Step 4: Constraints
  if (currentStep === 4) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <AlertTriangle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Any constraints we should consider?</h2>
          <p className="text-muted-foreground text-sm mt-1">All fields are optional</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Budget limit</Label>
            <Input
              placeholder="e.g., $10,000 or No budget constraints"
              value={data.constraints?.budget || ''}
              onChange={(e) => updateConstraint('budget', e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Team size</Label>
            <Input
              type="number"
              placeholder="e.g., 5"
              value={data.constraints?.team_size || ''}
              onChange={(e) => updateConstraint('team_size', e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Key dependencies</Label>
            <Input
              placeholder="e.g., Waiting on vendor approval, API integration"
              value={data.constraints?.dependencies || ''}
              onChange={(e) => updateConstraint('dependencies', e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Risk tolerance</Label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_TOLERANCES.map((risk) => (
                <motion.button
                  key={risk}
                  onClick={() => updateConstraint('risk_tolerance', risk)}
                  className={`p-3 rounded-xl border-2 transition-all capitalize ${
                    data.constraints?.risk_tolerance === risk
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {risk}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Success Definition
  if (currentStep === 5) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">How will you know this plan succeeded?</h2>
          <p className="text-muted-foreground text-sm mt-1">Optional — describe your success criteria</p>
        </div>

        <Textarea
          placeholder="e.g., Launch the product with 1000 beta users, achieve 90% customer satisfaction..."
          value={data.success_definition || ''}
          onChange={(e) => updateField('success_definition', e.target.value)}
          className="min-h-[150px]"
        />
      </div>
    );
  }

  return null;
}

// Utility to get the total number of strategic steps
export const STRATEGIC_STEPS_COUNT = 5;
