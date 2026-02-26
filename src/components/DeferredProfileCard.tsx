import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { professionConfig, type Profession, type Question, getFilteredQuestions } from '@/lib/adaptiveOnboarding';

/**
 * DeferredProfileCard
 * 
 * Shown on /home or /plan after plan generation.
 * Allows users to complete profession-specific questions
 * that were deferred from onboarding to reduce cognitive load.
 */
export function DeferredProfileCard() {
  const { user, profile, refreshProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [details, setDetails] = useState<Record<string, any>>({});

  const profession = profile?.profession as Profession | undefined;
  if (!profession || !professionConfig[profession] || dismissed) return null;

  const config = professionConfig[profession];
  const existingDetails = (profile?.professionDetails || {}) as Record<string, any>;

  // Check if profession questions are already answered
  const questions = getFilteredQuestions(profession, existingDetails);
  const hasUnansweredQuestions = questions.some(q => {
    if (q.label.includes('Optional') || q.key === 'aiToolsList' || q.key === 'constraints') return false;
    return !existingDetails[q.key];
  });

  if (!hasUnansweredQuestions) return null;

  const updateDetail = (key: string, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const toggleChip = (key: string, chip: string) => {
    const current = details[key] || existingDetails[key] || [];
    const updated = current.includes(chip)
      ? current.filter((c: string) => c !== chip)
      : [...current, chip];
    updateDetail(key, updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const merged = { ...existingDetails, ...details };
      
      // Combine custom technologies
      if (merged.technologies_custom) {
        const custom = (merged.technologies_custom as string).split(',').map((s: string) => s.trim()).filter((s: string) => s);
        merged.technologies = [...(merged.technologies || []), ...custom];
        delete merged.technologies_custom;
      }

      await supabase
        .from('profiles')
        .update({
          profession_details: merged,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await refreshProfile();
      toast.success('Profile updated! Future plans will be more tailored.');
      setDismissed(true);
    } catch {
      toast.error('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Complete your profile</p>
                <p className="text-xs text-muted-foreground">
                  Helps the AI create better plans for you
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  {questions.map((question) => {
                    // Skip already answered
                    if (existingDetails[question.key] && !details[question.key]) return null;

                    return (
                      <div key={question.key} className="space-y-2">
                        <Label className="text-sm">{question.label}</Label>

                        {question.type === 'select' && (
                          <Select
                            value={details[question.key] || existingDetails[question.key] || ''}
                            onValueChange={(v) => updateDetail(question.key, v)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={`Select ${question.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {question.type === 'text' && (
                          <Input
                            placeholder={question.placeholder || ''}
                            value={details[question.key] || existingDetails[question.key] || ''}
                            onChange={(e) => updateDetail(question.key, e.target.value)}
                            className="h-10"
                          />
                        )}

                        {question.type === 'textarea' && (
                          <Textarea
                            placeholder={question.placeholder || ''}
                            value={details[question.key] || existingDetails[question.key] || ''}
                            onChange={(e) => updateDetail(question.key, e.target.value)}
                            className="min-h-[80px]"
                          />
                        )}

                        {question.type === 'chips' && (
                          <div className="flex flex-wrap gap-2">
                            {question.options?.map((opt) => {
                              const selected = (details[question.key] || existingDetails[question.key] || []).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => toggleChip(question.key, opt)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    selected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="sm"
                      className="gradient-kaamyab"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDismissed(true)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default DeferredProfileCard;
