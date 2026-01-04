import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayProgressRingProps {
  completed: number;
  total: number;
  className?: string;
}

export function TodayProgressRing({ completed, total, className }: TodayProgressRingProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isAllDone = completed === total && total > 0;
  
  // SVG parameters
  const size = 88;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted/40"
        />
        
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-primary"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isAllDone ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Check className="w-6 h-6 text-primary" />
          </motion.div>
        ) : (
          <>
            <span className="text-xl font-bold text-foreground leading-none">
              {completed}/{total}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              today
            </span>
          </>
        )}
      </div>
    </div>
  );
}
