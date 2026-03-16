import { supabase } from '@/integrations/supabase/client';
import { getGoogleCalendarUrl, openCalendarUrl } from '@/lib/calendarService';
import { toast } from 'sonner';

export type PreferredCalendar = 'kamyaab' | 'google' | 'apple';

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  reminderMinutes?: number;
  taskRef?: string;
  planId?: string;
}

/**
 * Detect the best default calendar based on device platform.
 */
export function detectDefaultCalendar(): PreferredCalendar {
  if (typeof navigator === 'undefined') return 'kamyaab';
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMacSafari =
    /macintosh|mac os x/.test(ua) &&
    /safari/.test(ua) &&
    !/chrome|chromium|crios|firefox|fxios/.test(ua);
  if (isIOS || isMacSafari) return 'apple';
  if (/android/.test(ua)) return 'google';
  return 'kamyaab';
}

/**
 * Fetch the user's preferred calendar from their profile.
 */
export async function fetchPreferredCalendar(userId: string): Promise<PreferredCalendar> {
  const { data } = await supabase
    .from('profiles')
    .select('preferred_calendar')
    .eq('id', userId)
    .maybeSingle();
  return (data?.preferred_calendar as PreferredCalendar) || 'kamyaab';
}

/**
 * Save the user's preferred calendar to their profile.
 */
export async function savePreferredCalendar(userId: string, calendar: PreferredCalendar) {
  const { error } = await supabase
    .from('profiles')
    .update({ preferred_calendar: calendar } as any)
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Generate a Google Calendar URL for creating an event.
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startTime)}/${formatDate(event.endTime)}`,
    details: event.description || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate and trigger download of an ICS file for Apple Calendar.
 */
export function downloadICSFile(event: CalendarEventData): void {
  const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const escapeICS = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const uid = `kaamyab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@kaamyab.app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kaamyab//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description || '')}`,
    ...(event.reminderMinutes
      ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `TRIGGER:-PT${event.reminderMinutes}M`, 'DESCRIPTION:Reminder', 'END:VALARM']
      : []),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kaamyab-event.ics';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Route a calendar event to the appropriate calendar based on preference.
 * Returns 'kamyaab' if the event should be saved to the internal DB (caller handles),
 * otherwise opens the external calendar and returns the target.
 */
export function routeCalendarEvent(
  event: CalendarEventData,
  preferredCalendar: PreferredCalendar
): PreferredCalendar {
  if (preferredCalendar === 'google') {
    const url = generateGoogleCalendarUrl(event);
    openCalendarUrl(url);
    toast.success('Opening Google Calendar…');
    return 'google';
  }

  if (preferredCalendar === 'apple') {
    downloadICSFile(event);
    toast.success('Downloading calendar file…');
    return 'apple';
  }

  // 'kamyaab' — caller should save to calendar_events table
  return 'kamyaab';
}

export const CALENDAR_LABELS: Record<PreferredCalendar, string> = {
  kamyaab: 'Kamyaab Calendar',
  google: 'Google Calendar',
  apple: 'Apple Calendar',
};
