// Calendar integration service for direct calendar insertion
// Supports Google Calendar API with device-aware fallbacks for Apple/Google

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

// ============ Device Detection ============

/**
 * Detect if current device is an Apple device (iPhone, iPad, macOS Safari)
 * Uses navigator.userAgent safely without external libraries
 */
export const isAppleDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  
  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Check for macOS (including Safari on Mac)
  const isMac = /macintosh|mac os x/.test(userAgent) || platform.includes('mac');
  
  // Additional check for Safari on Mac (not Chrome/Firefox on Mac)
  const isSafari = /safari/.test(userAgent) && !/chrome|chromium|crios|firefox|fxios/.test(userAgent);
  
  return isIOS || (isMac && isSafari);
};

/**
 * Get appropriate button label based on device
 */
export const getCalendarButtonLabel = (): string => {
  return isAppleDevice() ? 'Add to Apple Calendar' : 'Add to Calendar';
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

// Calculate the event date based on plan start date, week number, and task index
// This ensures events are always scheduled correctly in the future
export const calculateTaskEventDate = (
  planStartDate: Date,
  weekNumber: number,
  taskIndex: number
): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate the start of the week based on plan start date
  // Week 1 starts on planStartDate, Week 2 starts 7 days later, etc.
  const weekStartDate = new Date(planStartDate);
  weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
  weekStartDate.setHours(0, 0, 0, 0);
  
  // Add task day offset (task 0 = day 0, task 1 = day 1, etc.)
  // Cap at 6 days max (within the week)
  const dayOffset = Math.min(taskIndex, 6);
  const eventDate = new Date(weekStartDate);
  eventDate.setDate(eventDate.getDate() + dayOffset);
  
  // Set time to 9:00 AM local to avoid timezone issues
  eventDate.setHours(9, 0, 0, 0);
  
  // SAFETY CHECK: If event date is in the past, reschedule to tomorrow at 9 AM
  if (eventDate < today) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }
  
  return eventDate;
};

// Distribute tasks evenly across a week based on plan start date
export const distributeTasksAcrossWeek = (
  tasks: TaskInput[],
  planStartDate: Date,
  weekNumber: number
): CalendarTask[] => {
  const calendarTasks: CalendarTask[] = [];
  
  tasks.forEach((task, index) => {
    // Calculate the correct future date for this task
    const taskDate = calculateTaskEventDate(planStartDate, weekNumber, index);
    
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
    
    // Add [Kaamyab] Week X prefix to title
    const titlePrefix = `[Kaamyab] Week ${weekNumber} — `;
    
    calendarTasks.push({
      title: `${titlePrefix}${task.title}`,
      description,
      date: taskDate,
      durationHours: 1,
    });
  });
  
  return calendarTasks;
};

// Get the plan start date from created_at timestamp
// Falls back to current date if not provided
export const getPlanStartDate = (planCreatedAt?: string | Date): Date => {
  if (planCreatedAt) {
    const startDate = new Date(planCreatedAt);
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }
  // Fallback to today if no created_at
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
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

// Generate Apple Calendar ICS content (in memory, no file download)
const generateICSContent = (task: CalendarTask): string => {
  const endTime = new Date(task.date);
  endTime.setHours(endTime.getHours() + task.durationHours);
  
  // Format dates for ICS (YYYYMMDDTHHmmssZ format)
  const formatICSDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Escape special characters for ICS format
  const escapeICS = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };
  
  // Generate unique ID for event
  const uid = `kaamyab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@kaamyab.app`;
  const now = formatICSDate(new Date());
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kaamyab//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(task.date)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${escapeICS(task.title)}`,
    `DESCRIPTION:${escapeICS(task.description || '')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

// Open Apple Calendar using data URI (triggers native iOS/macOS calendar dialog)
const openAppleCalendar = (task: CalendarTask): boolean => {
  try {
    const icsContent = generateICSContent(task);
    
    // Create data URI for the ICS content
    const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    
    // Open the data URI - on Apple devices this triggers the native "Add to Calendar" dialog
    window.location.href = dataUri;
    
    return true;
  } catch (error) {
    console.error('Failed to open Apple Calendar:', error);
    return false;
  }
};

// Open calendar URL in new tab (for Google/Outlook)
export const openCalendarUrl = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Detect user's likely calendar provider
export const detectCalendarProvider = (): 'google' | 'apple' | 'outlook' => {
  if (isAppleDevice()) {
    return 'apple';
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
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

  // For Apple devices, use ICS data URI approach
  if (isAppleDevice()) {
    if (tasks.length > 0) {
      let eventsOpened = 0;
      
      // Open each task as ICS - small delay between to prevent issues
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        
        if (i === 0) {
          const success = openAppleCalendar(task);
          if (success) eventsOpened++;
        } else {
          // Queue remaining tasks with delay
          await new Promise(resolve => setTimeout(resolve, 800));
          const success = openAppleCalendar(task);
          if (success) eventsOpened++;
        }
      }
      
      markWeekSynced(userId, weekNumber);
      
      return {
        success: eventsOpened > 0,
        eventsCreated: eventsOpened,
        provider: 'apple',
      };
    }
    
    return {
      success: false,
      eventsCreated: 0,
      error: 'No tasks to add to calendar',
      provider: 'none',
    };
  }

  // Fallback for non-Apple: Open Google Calendar URLs for ALL tasks
  if (tasks.length > 0) {
    let eventsOpened = 0;
    
    // Open all task calendar URLs with a small delay between each
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const url = getGoogleCalendarUrl(task);
      
      // Open each task with a slight delay to prevent popup blocking
      if (i === 0) {
        openCalendarUrl(url);
        eventsOpened++;
      } else {
        // Small delay between opens
        await new Promise(resolve => setTimeout(resolve, 300));
        openCalendarUrl(url);
        eventsOpened++;
      }
    }
    
    markWeekSynced(userId, weekNumber);
    
    return {
      success: true,
      eventsCreated: eventsOpened,
      provider: 'google',
    };
  }

  return {
    success: false,
    eventsCreated: 0,
    error: 'No tasks to add to calendar',
    provider: 'none',
  };
};

// Create a single task calendar event (for per-task button)
// Accepts optional customDate to allow user-selected scheduling
export const createSingleTaskCalendarEvent = (
  task: TaskInput,
  weekNumber: number,
  taskIndex: number,
  planStartDate: Date,
  customDate?: Date
): void => {
  // Use custom date if provided, otherwise calculate based on plan
  const taskDate = customDate || calculateTaskEventDate(planStartDate, weekNumber, taskIndex);
  
  const explanationDetails = getTaskExplanationText(task);
  
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
  
  const calendarTask: CalendarTask = {
    title: `[Kaamyab] Week ${weekNumber} — ${task.title}`,
    description,
    date: taskDate,
    durationHours: 1,
  };
  
  // Use device-aware calendar opening
  if (isAppleDevice()) {
    openAppleCalendar(calendarTask);
  } else {
    const url = getGoogleCalendarUrl(calendarTask);
    openCalendarUrl(url);
  }
};
