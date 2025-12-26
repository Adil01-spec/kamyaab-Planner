interface Task {
  title: string;
  priority: string;
  estimated_hours: number;
  completed?: boolean;
}

interface Week {
  week: number;
  focus: string;
  tasks: Task[];
}

/**
 * Generate calendar event data for a week's tasks
 */
export function generateWeekCalendarEvents(
  week: Week,
  weekStartDate: Date,
  projectTitle: string
): { icsContent: string; googleCalendarUrls: string[] } {
  const events: Array<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    priority: string;
  }> = [];

  // Distribute tasks across the week (Mon-Fri)
  const workDays = [1, 2, 3, 4, 5]; // Monday to Friday
  let dayIndex = 0;

  week.tasks.forEach((task, index) => {
    if (task.completed) return; // Skip completed tasks

    const taskDate = new Date(weekStartDate);
    // Find the next workday
    const targetDay = workDays[dayIndex % workDays.length];
    const currentDay = taskDate.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    taskDate.setDate(taskDate.getDate() + daysUntilTarget);

    // Set time based on priority
    let startHour = 9;
    if (task.priority === 'High') startHour = 9;
    else if (task.priority === 'Medium') startHour = 11;
    else startHour = 14;

    const startDate = new Date(taskDate);
    startDate.setHours(startHour, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + task.estimated_hours);

    events.push({
      title: task.title,
      description: `Project: ${projectTitle}\nWeek ${week.week}: ${week.focus}\nPriority: ${task.priority}\nEstimated: ${task.estimated_hours}h`,
      startDate,
      endDate,
      priority: task.priority,
    });

    dayIndex++;
  });

  // Generate ICS content
  const icsContent = generateICS(events, projectTitle, week.week);
  
  // Generate Google Calendar URLs
  const googleCalendarUrls = events.map(event => generateGoogleCalendarUrl(event));

  return { icsContent, googleCalendarUrls };
}

/**
 * Generate ICS file content for calendar import
 */
function generateICS(
  events: Array<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
  }>,
  projectTitle: string,
  weekNumber: number
): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kaamyab//Week Plan//EN',
    `X-WR-CALNAME:${projectTitle} - Week ${weekNumber}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event, index) => {
    const uid = `kaamyab-week${weekNumber}-task${index}-${Date.now()}@kaamyab.app`;
    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Generate Google Calendar URL for a single event
 */
function generateGoogleCalendarUrl(event: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}): string {
  const formatDateForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${formatDateForGoogle(event.startDate)}/${formatDateForGoogle(event.endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Download ICS file
 */
export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get the start date for a specific week
 */
export function getWeekStartDate(weekNumber: number, planCreatedAt: Date): Date {
  const startDate = new Date(planCreatedAt);
  // Move to next Monday if not already Monday
  const day = startDate.getDay();
  const diff = day === 0 ? 1 : (8 - day) % 7;
  if (diff > 0) {
    startDate.setDate(startDate.getDate() + diff);
  }
  // Add weeks
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  return startDate;
}
