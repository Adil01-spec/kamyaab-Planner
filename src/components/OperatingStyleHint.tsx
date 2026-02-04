/**
 * Operating Style Hint Component
 * 
 * Phase 10.1: Dismissible hint for PlanReset page.
 * Shows a single factual sentence reflecting a historical tendency.
 * 
 * Features:
 * - Only shown on plan creation/reset
 * - Dismissible with local state
 * - No enforcement, just observational guidance
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import {
  OperatingStyleProfile,
  generateOperatingStyleHint,
} from '@/lib/personalOperatingStyle';
import { supabase } from '@/integrations/supabase/client';

interface OperatingStyleHintProps {
  userId: string;
  planData?: { is_strategic_plan?: boolean } | null;
}

/**
 * Fetch cached operating style profile from database
 */
async function fetchCachedProfile(userId: string): Promise<OperatingStyleProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profession_details')
      .eq('id', userId)
      .single();

    if (error || !data?.profession_details) {
      return null;
    }

    const details = data.profession_details as { operating_style_profile?: OperatingStyleProfile };
    return details.operating_style_profile || null;
  } catch {
    return null;
  }
}

export function OperatingStyleHint({ userId, planData }: OperatingStyleHintProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasAccess } = useFeatureAccess('operating-style-overview', planData);

  useEffect(() => {
    if (!userId || !hasAccess) {
      setIsLoading(false);
      return;
    }

    const loadHint = async () => {
      const profile = await fetchCachedProfile(userId);
      const generatedHint = generateOperatingStyleHint(profile);
      setHint(generatedHint);
      setIsLoading(false);
    };

    loadHint();
  }, [userId, hasAccess]);

  // Don't render if:
  // - No access (Standard/Student)
  // - Dismissed
  // - Loading
  // - No hint to show
  if (!hasAccess || isDismissed || isLoading || !hint) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">{hint}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on your previous plans
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
