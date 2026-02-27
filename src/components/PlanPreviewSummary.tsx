import { Badge } from '@/components/ui/badge';
import { professionConfig, type Profession } from '@/lib/adaptiveOnboarding';
import { type StrategicPlanContext } from '@/lib/executiveDetection';
import { FileText, Calendar, Briefcase, Target, Compass, Clock, AlertTriangle, Trophy } from 'lucide-react';

interface PlanPreviewSummaryProps {
  fullName: string;
  profession: Profession | '';
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
  noDeadline: boolean;
  isStrategic: boolean;
  strategicPlanContext: StrategicPlanContext;
}

const PlanPreviewSummary = ({
  fullName,
  profession,
  projectTitle,
  projectDescription,
  projectDeadline,
  noDeadline,
  isStrategic,
  strategicPlanContext,
}: PlanPreviewSummaryProps) => {
  const profLabel = profession ? professionConfig[profession]?.label ?? profession : '';
  const ctx = strategicPlanContext as Record<string, any>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Review your plan details</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Everything looks good? Hit create to generate your plan.
        </p>
      </div>

      {/* Core Project Info */}
      <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
        <Row icon={<FileText className="w-4 h-4" />} label="Project" value={projectTitle} />
        <DescriptionRow description={projectDescription} />
        <Row
          icon={<Calendar className="w-4 h-4" />}
          label="Deadline"
          value={noDeadline ? 'Flexible timeline' : projectDeadline}
        />
        <Row icon={<Briefcase className="w-4 h-4" />} label="Role" value={profLabel} />

        <div className="flex items-center gap-2 pt-1">
          <Target className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Mode</span>
          <Badge variant={isStrategic ? 'default' : 'secondary'} className="ml-auto text-xs">
            {isStrategic ? 'Strategic' : 'Standard'}
          </Badge>
        </div>
      </div>

      {/* Strategic Details */}
      {isStrategic && (
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Strategic Context</p>
          {ctx.strategic_field && (
            <Row icon={<Compass className="w-4 h-4" />} label="Field" value={ctx.strategic_field} />
          )}
          {ctx.scope && (
            <Row icon={<Target className="w-4 h-4" />} label="Scope" value={ctx.scope} />
          )}
          {ctx.horizon && (
            <Row icon={<Clock className="w-4 h-4" />} label="Horizon" value={ctx.horizon} />
          )}
          {ctx.constraints && (
            <Row icon={<AlertTriangle className="w-4 h-4" />} label="Constraints" value={ctx.constraints} />
          )}
          {ctx.success_definition && (
            <Row icon={<Trophy className="w-4 h-4" />} label="Success" value={ctx.success_definition} />
          )}
        </div>
      )}

      {/* Microcopy */}
      <p className="text-xs text-muted-foreground text-center">
        Your plan will be structured into milestones and actionable tasks.
      </p>
    </div>
  );
};

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground ml-auto text-right max-w-[60%] break-words">{value}</span>
    </div>
  );
}

function DescriptionRow({ description }: { description: string }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground shrink-0 mt-0.5">
          <FileText className="w-4 h-4 opacity-0" />
        </span>
        <p className="text-sm text-muted-foreground/80 line-clamp-3">{description}</p>
      </div>
    </div>
  );
}

export default PlanPreviewSummary;
