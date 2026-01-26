import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StrategicFieldSelector } from './StrategicFieldSelector';
import { StrategicDiscoveryQuestion } from './StrategicDiscoveryQuestion';
import {
  type StrategicField,
  type StrategicContextProfile,
  type DiscoveryQuestion,
  type DiscoveryAnswer,
  type DiscoveryResponse,
  FALLBACK_QUESTIONS,
  deriveContextProfileFromAnswers,
} from '@/lib/strategicDiscovery';

type FlowState = 'field_selection' | 'questioning' | 'complete';

interface StrategicDiscoveryFlowProps {
  onComplete: (profile: StrategicContextProfile | null) => void;
  onSkip: () => void;
}

const MAX_QUESTIONS = 8;
const DEFAULT_QUESTION_COUNT = 6;

export function StrategicDiscoveryFlow({ onComplete, onSkip }: StrategicDiscoveryFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('field_selection');
  const [selectedField, setSelectedField] = useState<StrategicField | null>(null);
  const [answers, setAnswers] = useState<DiscoveryAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<DiscoveryQuestion | null>(null);
  const [suggestedTotal, setSuggestedTotal] = useState(DEFAULT_QUESTION_COUNT);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  /**
   * Fetch next question from AI edge function
   */
  const fetchNextQuestion = useCallback(async (
    field: StrategicField,
    currentAnswers: DiscoveryAnswer[]
  ): Promise<DiscoveryResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('strategic-discovery', {
        body: {
          field,
          answers: currentAnswers,
          questionCount: currentAnswers.length + 1,
        },
      });

      if (error) {
        console.error('Strategic discovery error:', error);
        return null;
      }

      return data as DiscoveryResponse;
    } catch (err) {
      console.error('Failed to fetch discovery question:', err);
      return null;
    }
  }, []);

  /**
   * Get fallback question for the current index
   */
  const getFallbackQuestion = useCallback((field: StrategicField, index: number): DiscoveryQuestion | null => {
    const questions = FALLBACK_QUESTIONS[field];
    if (index < questions.length) {
      return questions[index];
    }
    return null;
  }, []);

  /**
   * Handle field selection
   */
  const handleFieldSelect = useCallback(async (field: StrategicField) => {
    setSelectedField(field);
    setFlowState('questioning');
    setIsLoading(true);

    // Try AI first
    const response = await fetchNextQuestion(field, []);
    
    if (response?.nextQuestion) {
      setCurrentQuestion(response.nextQuestion);
      setSuggestedTotal(response.suggestedQuestionCount || DEFAULT_QUESTION_COUNT);
    } else {
      // Fall back to predefined questions
      setUseFallback(true);
      const fallback = getFallbackQuestion(field, 0);
      if (fallback) {
        setCurrentQuestion(fallback);
        setSuggestedTotal(FALLBACK_QUESTIONS[field].length);
      } else {
        // No questions available, complete with basic profile
        toast.info('Discovery skipped');
        onComplete({ 
          field,
          decision_authority: 'medium',
          uncertainty_level: 'medium',
          dependency_density: 'medium',
          risk_tolerance: 'medium',
          time_sensitivity: 'medium',
        });
        return;
      }
    }
    
    setIsLoading(false);
  }, [fetchNextQuestion, getFallbackQuestion, onComplete]);

  /**
   * Handle answer selection
   */
  const handleAnswer = useCallback(async (answerValue: string) => {
    if (!currentQuestion || !selectedField) return;

    const newAnswer: DiscoveryAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: answerValue,
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    
    // Check if we've reached max questions
    if (updatedAnswers.length >= MAX_QUESTIONS) {
      const profile = deriveContextProfileFromAnswers(selectedField, updatedAnswers);
      onComplete(profile);
      return;
    }

    setIsLoading(true);

    if (useFallback) {
      // Use fallback questions
      const nextIndex = fallbackIndex + 1;
      const nextQuestion = getFallbackQuestion(selectedField, nextIndex);
      
      if (nextQuestion) {
        setFallbackIndex(nextIndex);
        setCurrentQuestion(nextQuestion);
      } else {
        // No more fallback questions, complete
        const profile = deriveContextProfileFromAnswers(selectedField, updatedAnswers);
        onComplete(profile);
        return;
      }
    } else {
      // Try AI
      const response = await fetchNextQuestion(selectedField, updatedAnswers);
      
      if (response?.isComplete || !response?.nextQuestion) {
        // AI says we have enough context
        const profile = response?.contextProfile || deriveContextProfileFromAnswers(selectedField, updatedAnswers);
        onComplete(profile);
        return;
      }
      
      setCurrentQuestion(response.nextQuestion);
      setSuggestedTotal(response.suggestedQuestionCount || DEFAULT_QUESTION_COUNT);
    }
    
    setIsLoading(false);
  }, [currentQuestion, selectedField, answers, useFallback, fallbackIndex, fetchNextQuestion, getFallbackQuestion, onComplete]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (answers.length === 0) {
      // Go back to field selection
      setFlowState('field_selection');
      setSelectedField(null);
      setCurrentQuestion(null);
      return;
    }

    // Remove last answer and go to previous question
    const previousAnswers = answers.slice(0, -1);
    setAnswers(previousAnswers);
    
    if (useFallback && selectedField) {
      const prevIndex = fallbackIndex - 1;
      setFallbackIndex(Math.max(0, prevIndex));
      const prevQuestion = getFallbackQuestion(selectedField, prevIndex);
      if (prevQuestion) {
        setCurrentQuestion(prevQuestion);
      }
    }
    // Note: For AI-generated questions, we can't easily go back
    // since each question depends on previous context.
    // In this case, we just stay on current question.
  }, [answers, useFallback, fallbackIndex, selectedField, getFallbackQuestion]);

  /**
   * Handle skip
   */
  const handleSkip = useCallback(() => {
    // If we have some answers, derive a profile from them
    if (selectedField && answers.length > 0) {
      const profile = deriveContextProfileFromAnswers(selectedField, answers);
      onComplete(profile);
    } else {
      onSkip();
    }
  }, [selectedField, answers, onComplete, onSkip]);

  return (
    <div className="w-full px-4">
      <AnimatePresence mode="wait">
        {flowState === 'field_selection' && (
          <StrategicFieldSelector
            key="field-selector"
            onSelect={handleFieldSelect}
            onSkip={onSkip}
          />
        )}
        
        {flowState === 'questioning' && currentQuestion && (
          <StrategicDiscoveryQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            questionNumber={answers.length + 1}
            totalQuestions={suggestedTotal}
            isLoading={isLoading}
            onAnswer={handleAnswer}
            onBack={handleBack}
            onSkip={handleSkip}
            canGoBack={answers.length > 0 || flowState === 'questioning'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StrategicDiscoveryFlow;
