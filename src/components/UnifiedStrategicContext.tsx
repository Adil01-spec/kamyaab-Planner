import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, User, Users, Clock, AlertTriangle, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  StrategicPlanContext,
  SENIORITY_LEVELS,
  PLANNING_SCOPES,
  TIME_HORIZONS,
  RISK_TOLERANCES,
} from '@/lib/executiveDetection';
import { StrategicDiscoveryFlow } from '@/components/StrategicDiscoveryFlow';
import { type StrategicContextProfile } from '@/lib/strategicDiscovery';

interface UnifiedStrategicContextProps {
  data: StrategicPlanContext;
  onChange: (data: StrategicPlanContext) => void;
  onDiscoveryComplete?: (profile: StrategicContextProfile | null) => void;
  showDiscovery?: boolean;
}

type ExpandedSection = 'discovery' | 'role' | 'constraints' | 'success' | null;

export function UnifiedStrategicContext({
  data,
  onChange,
  onDiscoveryComplete,
  showDiscovery = true,
}: UnifiedStrategicContextProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(
    showDiscovery ? 'discovery' : 'role'
  );
  const [discoveryDone, setDiscoveryDone] = useState(false);

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

  const handleDiscoveryComplete = (profile: StrategicContextProfile | null) => {
    setDiscoveryDone(true);
    setExpandedSection('role');
    onDiscoveryComplete?.(profile);
  };

  const handleDiscoverySkip = () => {
    setDiscoveryDone(true);
    setExpandedSection('role');
  };

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const SectionHeader = ({ 
    section, 
    icon: Icon, 
    title, 
    subtitle,
    completed,
  }: { 
    section: ExpandedSection; 
    icon: React.ElementType; 
    title: string; 
    subtitle: string;
    completed?: boolean;
  }) => (
    <CollapsibleTrigger asChild>
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            completed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {expandedSection === section ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </CollapsibleTrigger>
  );

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Strategic Context</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All sections are optional — add what's relevant
        </p>
      </div>

      {/* AI Discovery Section */}
      {showDiscovery && (
        <Collapsible open={expandedSection === 'discovery'} onOpenChange={() => toggleSection('discovery')}>
          <SectionHeader
            section="discovery"
            icon={Target}
            title="AI Context Discovery"
            subtitle={discoveryDone ? 'Completed' : 'Quick questions to tailor your plan'}
            completed={discoveryDone}
          />
          <CollapsibleContent>
            <div className="pt-3 pb-1">
              <StrategicDiscoveryFlow
                onComplete={handleDiscoveryComplete}
                onSkip={handleDiscoverySkip}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Role & Scope Section */}
      <Collapsible open={expandedSection === 'role'} onOpenChange={() => toggleSection('role')}>
        <SectionHeader
          section="role"
          icon={User}
          title="Role & Scope"
          subtitle="Your seniority, scope, and time horizon"
          completed={!!(data.planning_seniority || data.planning_scope?.length || data.time_horizon)}
        />
        <CollapsibleContent>
          <div className="pt-3 pb-1 space-y-5 px-1">
            {/* Seniority */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Your role level</Label>
              <div className="grid grid-cols-2 gap-2">
                {SENIORITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateField('planning_seniority', level.value)}
                    className={`p-3 rounded-xl border text-sm text-left transition-all ${
                      data.planning_seniority === level.value
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Planning Scope */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Who does this plan affect?</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLANNING_SCOPES.map((scope) => {
                  const isSelected = (data.planning_scope || []).includes(scope.value);
                  return (
                    <button
                      key={scope.value}
                      onClick={() => toggleScope(scope.value)}
                      className={`p-3 rounded-xl border text-sm text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Planning horizon</Label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_HORIZONS.map((horizon) => (
                  <button
                    key={horizon.value}
                    onClick={() => updateField('time_horizon', horizon.value)}
                    className={`p-3 rounded-xl border text-sm transition-all text-center ${
                      data.time_horizon === horizon.value
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {horizon.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Constraints Section */}
      <Collapsible open={expandedSection === 'constraints'} onOpenChange={() => toggleSection('constraints')}>
        <SectionHeader
          section="constraints"
          icon={AlertTriangle}
          title="Constraints"
          subtitle="Budget, team size, dependencies, risk"
          completed={!!(data.constraints?.budget || data.constraints?.team_size || data.constraints?.dependencies || data.constraints?.risk_tolerance)}
        />
        <CollapsibleContent>
          <div className="pt-3 pb-1 space-y-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Budget</Label>
                <Input
                  placeholder="e.g., $10,000"
                  value={data.constraints?.budget || ''}
                  onChange={(e) => updateConstraint('budget', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Team size</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={data.constraints?.team_size || ''}
                  onChange={(e) => updateConstraint('team_size', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Key dependencies</Label>
              <Input
                placeholder="e.g., Waiting on vendor approval"
                value={data.constraints?.dependencies || ''}
                onChange={(e) => updateConstraint('dependencies', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Risk tolerance</Label>
              <div className="grid grid-cols-3 gap-2">
                {RISK_TOLERANCES.map((risk) => (
                  <button
                    key={risk}
                    onClick={() => updateConstraint('risk_tolerance', risk)}
                    className={`p-2.5 rounded-xl border text-sm capitalize transition-all ${
                      data.constraints?.risk_tolerance === risk
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Success Definition Section */}
      <Collapsible open={expandedSection === 'success'} onOpenChange={() => toggleSection('success')}>
        <SectionHeader
          section="success"
          icon={Trophy}
          title="Success Definition"
          subtitle="How will you know this plan succeeded?"
          completed={!!data.success_definition}
        />
        <CollapsibleContent>
          <div className="pt-3 pb-1 px-1">
            <Textarea
              placeholder="e.g., Launch with 1000 beta users, achieve 90% satisfaction..."
              value={data.success_definition || ''}
              onChange={(e) => updateField('success_definition', e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export default UnifiedStrategicContext;
