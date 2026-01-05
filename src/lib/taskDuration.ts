import { formatDistanceStrict, differenceInMinutes, differenceInHours } from 'date-fns';

/**
 * Format duration between start and completion time
 */
export const formatTaskDuration = (scheduledAt: string, completedAt: string): string => {
  const start = new Date(scheduledAt);
  const end = new Date(completedAt);
  
  const minutes = differenceInMinutes(end, start);
  
  if (minutes < 1) {
    return 'Just now';
  }
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = differenceInHours(end, start);
  const remainingMins = minutes % 60;
  
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMins}m`;
};

/**
 * Calculate if task was completed faster or slower than estimated
 */
export const getCompletionInsight = (
  scheduledAt: string, 
  completedAt: string, 
  estimatedHours: number
): { label: string; type: 'fast' | 'normal' | 'slow' } => {
  const start = new Date(scheduledAt);
  const end = new Date(completedAt);
  
  const actualMinutes = differenceInMinutes(end, start);
  const estimatedMinutes = estimatedHours * 60;
  
  const ratio = actualMinutes / estimatedMinutes;
  
  if (ratio <= 0.7) {
    return { label: 'Ahead of time', type: 'fast' };
  }
  
  if (ratio <= 1.2) {
    return { label: 'On track', type: 'normal' };
  }
  
  return { label: 'Took longer', type: 'slow' };
};
