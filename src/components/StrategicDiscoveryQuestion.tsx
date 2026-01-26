import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type DiscoveryQuestion } from '@/lib/strategicDiscovery';

interface StrategicDiscoveryQuestionProps {
  question: DiscoveryQuestion;
  questionNumber: number;
  totalQuestions: number;
  isLoading: boolean;
  onAnswer: (answer: string) => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
}

export function StrategicDiscoveryQuestion({
  question,
  questionNumber,
  totalQuestions,
  isLoading,
  onAnswer,
  onBack,
  onSkip,
  canGoBack,
}: StrategicDiscoveryQuestionProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {questionNumber} of ~{totalQuestions}</span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < questionNumber
                  ? 'bg-primary'
                  : i === questionNumber - 1
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onAnswer(option.value)}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Thinking of the next question...</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={!canGoBack || isLoading}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip discovery
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export default StrategicDiscoveryQuestion;
