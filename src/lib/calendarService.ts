// Calendar integration service for direct calendar insertion
// Supports Google Calendar API with fallback deep links for Apple/Outlook

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || '';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export interface CalendarTask {
  title: string;
  description?: string;
  date: Date;
  durationHours: number;
}

interface CalendarSyncResult {
  success: boolean;
  eventsCreated: number;
  error?: string;
  provider: 'google' | 'apple' | 'outlook' | 'none';
}

// Track synced weeks to prevent duplicates (in-memory, per session)
const syncedWeeks = new Set<string>();

// Generate unique week key for deduplication
export const getWeekKey = (userId: string, weekNumber: number): string => {
  return `${userId}_week_${weekNumber}`;
};

// Check if week was already synced this session
export const isWeekSynced = (userId: string, weekNumber: number): boolean => {
  return syncedWeeks.has(getWeekKey(userId, weekNumber));
};

// Mark week as synced
export const markWeekSynced = (userId: string, weekNumber: number): void => {
  syncedWeeks.add(getWeekKey(userId, weekNumber));
};

// Task explanation can be nested object or flat fields
interface TaskExplanation {
  how: string;
  why: string;
  expected_outcome: string;
}

interface TaskInput {
  title: string;
  priority: string;
  estimated_hours: number;
  explanation?: TaskExplanation | string;
  how_to?: string;
  expected_outcome?: string;
}

// Helper to extract explanation details from task
function getTaskExplanationText(task: TaskInput): { how: string; why: string; expectedOutcome: string } {
  // Handle nested explanation object (new structure)
  if (task.explanation && typeof task.explanation === 'object') {
    const exp = task.explanation as TaskExplanation;
    return {
      how: exp.how || '',
      why: exp.why || '',
      expectedOutcome: exp.expected_outcome || ''
    };
  }
  
  // Handle flat structure (legacy)
  return {
    how: task.how_to || '',
    why: typeof task.explanation === 'string' ? task.explanation : '',
    expectedOutcome: task.expected_outcome || ''
  };
}

// Distribute tasks evenly across a week (Mon-Fri)
export const distributeTasksAcrossWeek = (
  tasks: TaskInput[],
  weekStartDate: Date
): CalendarTask[] => {
  const calendarTasks: CalendarTask[] = [];
  const workDays = 5; // Monday to Friday
  const tasksPerDay = Math.ceil(tasks.length / workDays);
  
  tasks.forEach((task, index) => {
    const dayOffset = Math.floor(index / tasksPerDay);
    const taskDate = new Date(weekStartDate);
    taskDate.setDate(taskDate.getDate() + dayOffset);
    
    // Set time based on position in day (9am, 11am, 2pm, 4pm)
    const timeSlots = [9, 11, 14, 16];
    const slotIndex = index % tasksPerDay;
    taskDate.setHours(timeSlots[slotIndex] || 9, 0, 0, 0);
    
    // Get explanation details (handles both nested and flat structure)
    const explanationDetails = getTaskExplanationText(task);
    
    // Build rich description with how-to and expected outcome
    let description = `Priority: ${task.priority}\nEstimated time: ${task.estimated_hours} hours\n`;
    
    if (explanationDetails.why) {
      description += `\n📌 Why it matters:\n${explanationDetails.why}\n`;
    }
    
    if (explanationDetails.how) {
      description += `\n🔧 How to do it:\n${explanationDetails.how}\n`;
    }
    
    if (explanationDetails.expectedOutcome) {
      description += `\n🎯 Expected outcome:\n${explanationDetails.expectedOutcome}\n`;
    }
    
    description += `\n—\nPart of your Kaamyab productivity plan.`;
    
    calendarTasks.push({
      title: task.title,
      description,
      date: taskDate,
      durationHours: 1,
    });
  });
  
  return calendarTasks;
};

// Get the start of the current week (Monday)
export const getCurrentWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ============ Google Calendar Integration ============

let googleTokenClient: GoogleTokenClient | null = null;
let googleAccessToken: string | null = null;

// Google OAuth token client type
interface GoogleTokenClient {
  callback: (response: { access_token?: string; error?: string }) => void;
  requestAccessToken: (options: { prompt?: string }) => void;
}

// Check if Google API is available
export const isGoogleApiAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).google !== 'undefined' &&
         !!(window as any).google?.accounts?.oauth2;
};

// Initialize Google OAuth
export const initGoogleCalendar = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Calendar Client ID not configured');
      resolve(false);
      return;
    }

    if (!isGoogleApiAvailable()) {
      console.warn('Google API not loaded');
      resolve(false);
      return;
    }

    try {
      googleTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            googleAccessToken = response.access_token;
          }
        },
      });
      resolve(true);
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      resolve(false);
    }
  });
};

// Request Google Calendar permission
export const requestGooglePermission = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!googleTokenClient) {
      reject(new Error('Google Calendar not initialized'));
      return;
    }

    try {
      googleTokenClient.callback = (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        if (response.access_token) {
          googleAccessToken = response.access_token;
          resolve(response.access_token);
        } else {
          reject(new Error('No access token received'));
        }
      };

      googleTokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      reject(error);
    }
  });
};

// Create event in Google Calendar
const createGoogleEvent = async (
  task: CalendarTask,
  accessToken: string
): Promise<boolean> => {
  const endTime = new Date(task.date);
  endTime.setHours(endTime.getHours() + task.durationHours);

  const event = {
    summary: task.title,
    description: task.description || '',
    start: {
      dateTime: task.date.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    return false;
  }
};

// Sync tasks to Google Calendar
export const syncToGoogleCalendar = async (
  tasks: CalendarTask[]
): Promise<CalendarSyncResult> => {
  if (!googleAccessToken) {
    try {
      await requestGooglePermission();
    } catch (error) {
      return {
        success: false,
        eventsCreated: 0,
        error: 'Calendar permission denied. Please allow access to add events.',
        provider: 'google',
      };
    }
  }

  if (!googleAccessToken) {
    return {
      success: false,
      eventsCreated: 0,
      error: 'Failed to get calendar access',
      provider: 'google',
    };
  }

  let created = 0;
  for (const task of tasks) {
    const success = await createGoogleEvent(task, googleAccessToken);
    if (success) created++;
  }

  return {
    success: created > 0,
    eventsCreated: created,
    provider: 'google',
    error: created === 0 ? 'Failed to create any events' : undefined,
  };
};

// ============ Fallback Calendar Links ============

// Generate Google Calendar web URL (fallback)
export const getGoogleCalendarUrl = (task: CalendarTask): string => {
  const endTime = new Date(task.date);
  endTime.setHours(endTime.getHours() + task.durationHours);
  
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: `${formatDate(task.date)}/${formatDate(endTime)}`,
    details: task.description || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate Outlook Calendar URL
export const getOutlookCalendarUrl = (task: CalendarTask): string => {
  const endTime = new Date(task.date);
  endTime.setHours(endTime.getHours() + task.durationHours);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: task.title,
    startdt: task.date.toISOString(),
    enddt: endTime.toISOString(),
    body: task.description || '',
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Generate Apple Calendar URL (webcal protocol)
export const getAppleCalendarUrl = (task: CalendarTask): string => {
  // Apple Calendar uses webcal:// protocol or system calendar intent
  // For web, we'll use the Google Calendar URL as Apple Calendar can subscribe to it
  return getGoogleCalendarUrl(task);
};

// Open calendar URL in new tab
export const openCalendarUrl = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Detect user's likely calendar provider
export const detectCalendarProvider = (): 'google' | 'apple' | 'outlook' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod|macintosh/.test(userAgent)) {
    return 'apple';
  }
  
  // Check for Outlook-related indicators
  if (/outlook|microsoft/.test(userAgent)) {
    return 'outlook';
  }
  
  // Default to Google as most common
  return 'google';
};

// Main sync function that tries Google API first, then falls back to deep links
export const syncWeekToCalendar = async (
  tasks: CalendarTask[],
  userId: string,
  weekNumber: number
): Promise<CalendarSyncResult> => {
  // Check for duplicates
  if (isWeekSynced(userId, weekNumber)) {
    return {
      success: true,
      eventsCreated: 0,
      error: 'This week has already been added to your calendar.',
      provider: 'none',
    };
  }

  // Try Google Calendar API first
  if (GOOGLE_CLIENT_ID && isGoogleApiAvailable()) {
    const initialized = await initGoogleCalendar();
    if (initialized) {
      const result = await syncToGoogleCalendar(tasks);
      if (result.success) {
        markWeekSynced(userId, weekNumber);
        return result;
      }
    }
  }

  // Fallback: Open calendar URLs based on detected provider
  const provider = detectCalendarProvider();
  
  // For fallback, open the first task's calendar URL
  // (Opening all at once would be intrusive)
  if (tasks.length > 0) {
    let url: string;
    switch (provider) {
      case 'outlook':
        url = getOutlookCalendarUrl(tasks[0]);
        break;
      case 'apple':
      case 'google':
      default:
        url = getGoogleCalendarUrl(tasks[0]);
    }
    
    openCalendarUrl(url);
    markWeekSynced(userId, weekNumber);
    
    return {
      success: true,
      eventsCreated: 1,
      provider,
      error: tasks.length > 1 
        ? `Opened first task. Please add remaining ${tasks.length - 1} tasks manually.`
        : undefined,
    };
  }

  return {
    success: false,
    eventsCreated: 0,
    error: 'No tasks to add to calendar',
    provider: 'none',
  };
};
