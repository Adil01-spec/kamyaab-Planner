import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Calendar } from 'lucide-react';
import { getToneProfile, getTonedCopy, type Profession } from '@/lib/adaptiveOnboarding';

interface UnifiedProjectStepProps {
  projectTitle: string;
  projectDescription: string;
  projectDeadline: string;
  noDeadline: boolean;
  profession?: Profession | '';
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onNoDeadlineChange: (checked: boolean) => void;
  /** Optional strategic toggle to render at the bottom */
  strategicToggle?: React.ReactNode;
  /** Optional profile summary to render at the top (for reset flow) */
  profileSummary?: React.ReactNode;
  /** Optional guidance hint */
  guidanceHint?: React.ReactNode;
}

export function UnifiedProjectStep({
  projectTitle,
  projectDescription,
  projectDeadline,
  noDeadline,
  profession,
  onTitleChange,
  onDescriptionChange,
  onDeadlineChange,
  onNoDeadlineChange,
  strategicToggle,
  profileSummary,
  guidanceHint,
}: UnifiedProjectStepProps) {
  const tone = profession ? getToneProfile(profession as Profession) : 'casual';

  return (
    <motion.div
      className="space-y-5 animate-fade-in"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-3">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">What does success look like?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {getTonedCopy('customizeExperience', tone)}
        </p>
      </div>

      {profileSummary}
      {guidanceHint}

      {/* Project Title */}
      <div className="space-y-2">
        <Label htmlFor="projectTitle">Project Title</Label>
        <Input
          id="projectTitle"
          placeholder="e.g., Launch my e-commerce store"
          value={projectTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-12"
          autoFocus
        />
      </div>

      {/* Project Description */}
      <div className="space-y-2">
        <Label htmlFor="projectDescription">
          {getTonedCopy('projectDescription', tone)}
        </Label>
        <Textarea
          id="projectDescription"
          placeholder={getTonedCopy('projectDescriptionPlaceholder', tone)}
          value={projectDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      {/* Deadline */}
      <div className="space-y-3">
        <Label htmlFor="projectDeadline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {getTonedCopy('projectDeadline', tone)}
        </Label>
        <Input
          id="projectDeadline"
          type="date"
          value={projectDeadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
          className="h-12"
          min={new Date().toISOString().split('T')[0]}
          disabled={noDeadline}
        />
        <div className="flex items-center space-x-3">
          <Checkbox
            id="noDeadline"
            checked={noDeadline}
            onCheckedChange={(checked) => onNoDeadlineChange(checked === true)}
          />
          <label
            htmlFor="noDeadline"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            {getTonedCopy('noDeadlineLabel', tone)}
          </label>
        </div>
        {noDeadline && (
          <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            {getTonedCopy('noDeadlineHint', tone)}
          </p>
        )}
      </div>

      {/* Strategic toggle embedded at bottom */}
      {strategicToggle}
    </motion.div>
  );
}

export default UnifiedProjectStep;
