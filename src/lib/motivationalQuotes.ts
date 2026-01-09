export type UserState = 'momentum' | 'neutral' | 'burnout-risk';

interface Quote {
  text: string;
  state: UserState;
}

const quotes: Quote[] = [
  // Momentum quotes - acknowledge consistency without pressure
  { text: "Consistency compounds quietly.", state: 'momentum' },
  { text: "Small steps, steady rhythm.", state: 'momentum' },
  { text: "You're building something real.", state: 'momentum' },
  { text: "The habit is forming.", state: 'momentum' },
  { text: "Momentum is on your side.", state: 'momentum' },
  { text: "One task at a time, one day at a time.", state: 'momentum' },
  { text: "Progress feels different when it's earned.", state: 'momentum' },
  
  // Neutral quotes - gentle, no pressure
  { text: "Progress doesn't need intensity.", state: 'neutral' },
  { text: "Today is enough.", state: 'neutral' },
  { text: "Show up. That's the practice.", state: 'neutral' },
  { text: "Every day is a fresh start.", state: 'neutral' },
  { text: "Patience is productive.", state: 'neutral' },
  { text: "You're here. That matters.", state: 'neutral' },
  { text: "Slow is still moving.", state: 'neutral' },
  
  // Burnout-risk quotes - supportive, not corrective
  { text: "Rest is part of forward motion.", state: 'burnout-risk' },
  { text: "Gentleness is a strategy.", state: 'burnout-risk' },
  { text: "Recovery is progress.", state: 'burnout-risk' },
  { text: "You don't have to push today.", state: 'burnout-risk' },
  { text: "Breathing room is earned, not lost.", state: 'burnout-risk' },
  { text: "Even mountains have valleys.", state: 'burnout-risk' },
  { text: "Pace over pressure.", state: 'burnout-risk' },
];

// Get a consistent quote for the day based on date and state
export const getDailyQuote = (state: UserState): string => {
  const stateQuotes = quotes.filter(q => q.state === state);
  
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  
  const index = dayOfYear % stateQuotes.length;
  return stateQuotes[index].text;
};

// Storage key for dismissed quotes
const DISMISSED_QUOTE_KEY = 'kaamyab_dismissed_quote_date';

export const isQuoteDismissedToday = (): boolean => {
  const dismissed = localStorage.getItem(DISMISSED_QUOTE_KEY);
  if (!dismissed) return false;
  
  const today = new Date().toDateString();
  return dismissed === today;
};

export const dismissQuoteForToday = (): void => {
  const today = new Date().toDateString();
  localStorage.setItem(DISMISSED_QUOTE_KEY, today);
};
