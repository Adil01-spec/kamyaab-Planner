// Full completion screen shown when plan has completed_at set

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Calendar, CheckCircle2, BarChart3, Copy, Archive, Plus } from 'lucide-react';
import { formatTotalTime, calculateTotalTimeSpent } from '@/lib/executionTimer';
import { calculateCompletionAnalytics, buildPlanMemory, savePlanMemory, type CompletionAnalytics } from '@/lib/planCompletion';
import { PlanCompletionSummary } from '@/components/PlanCompletionSummary';
import { PlanMemoryConsentModal } from '@/components/PlanMemoryConsentModal';
import { archiveCurrentPlan } from '@/hooks/usePlanHistory';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface PlanCompletionScreenProps {
  plan: any;
  planId: string;
  planCreatedAt: string;
  userId: string;
  projectTitle: string;
  projectDescription?: string;
  onPlanDeleted: () => void;
  showConsentModal: boolean;
  onConsentModalChange: (open: boolean) => void;
}

export function PlanCompletionScreen({
  plan,
  planId,
  planCreatedAt,
  userId,
  projectTitle,
  projectDescription,
  onPlanDeleted,
  showConsentModal,
  onConsentModalChange,
}: PlanCompletionScreenProps) {
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const completedAt = plan.completed_at;
  const totalTimeSpent = calculateTotalTimeSpent(plan);
  const totalDays = differenceInDays(new Date(completedAt), new Date(planCreatedAt));
  const analytics: CompletionAnalytics = calculateCompletionAnalytics(plan, planCreatedAt);

  // Count total tasks
  let totalTasks = 0;
  for (const week of plan.weeks || []) {
    totalTasks += (week.tasks || []).length;
  }

  // Subtle confetti on first render
  useEffect(() => {
    if (!hasShownConfetti) {
      setHasShownConfetti(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#22c55e', '#10b981', '#fbbf24', '#06b6d4'],
        disableForReducedMotion: true,
      });
    }
  }, [hasShownConfetti]);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveCurrentPlan(
        userId,
        plan,
        planCreatedAt,
        projectTitle,
        projectDescription
      );
      // Delete the active plan
      await supabase.from('plans').delete().eq('id', planId);
      toast({ title: 'Plan archived', description: 'Your completed plan has been saved to history.' });
      onPlanDeleted();
      navigate('/plan/reset', { replace: true });
    } catch (err) {
      console.error('Error archiving plan:', err);
      toast({ title: 'Archive failed', description: 'Could not archive plan. Please try again.', variant: 'destructive' });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCreateNew = async () => {
    await handleArchive();
  };

  const handleConsent = async () => {
    const memory = buildPlanMemory(plan, planCreatedAt, planId);
    await savePlanMemory(userId, memory);
    toast({ title: 'Execution patterns saved', description: 'Your next plan will be smarter.' });
  };

  const handleDecline = () => {
    // Do nothing — just dismiss
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card overflow-hidden">
            <CardContent className="py-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Trophy className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-1">Plan Completed</h2>
              <p className="text-muted-foreground mb-6">
                Completed {format(new Date(completedAt), 'MMMM d, yyyy')}
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatTotalTime(totalTimeSpent)}</p>
                  <p className="text-xs text-muted-foreground">Time Invested</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{Math.max(1, totalDays)}</p>
                  <p className="text-xs text-muted-foreground">Days Taken</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 mb-1">100%</Badge>
                  <p className="text-xs text-muted-foreground">Completion</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(true)}
                  className="flex-1"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Summary
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({ title: 'Coming soon', description: 'Plan duplication will be available in a future update.' });
                  }}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Plan
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-3">
                <Button
                  variant="outline"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="flex-1"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Plan
                </Button>
                <Button
                  onClick={handleCreateNew}
                  disabled={isArchiving}
                  className="flex-1 gradient-kaamyab hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Summary Dialog */}
      <PlanCompletionSummary
        open={showSummary}
        onOpenChange={setShowSummary}
        analytics={analytics}
      />

      {/* Consent Modal */}
      <PlanMemoryConsentModal
        open={showConsentModal}
        onOpenChange={onConsentModalChange}
        onConsent={handleConsent}
        onDecline={handleDecline}
      />
    </>
  );
}
