import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarEvents, type CalendarEvent, type CreateCalendarEventInput, type UpdateCalendarEventInput } from '@/hooks/useCalendarEvents';
import { CalendarEventModal } from '@/components/CalendarEventModal';
import { BottomNav } from '@/components/BottomNav';
import { DynamicBackground } from '@/components/DynamicBackground';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, addDays, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, LayoutGrid, Link2, Clock, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileSettings } from '@/hooks/useMobileSettings';
import { useDesktopSettings } from '@/hooks/useDesktopSettings';
import { DesktopHamburgerMenu } from '@/components/DesktopHamburgerMenu';
import { supabase } from '@/integrations/supabase/client';
import { useDismissMissedEvents } from '@/hooks/useTaskCalendarEvents';

const CalendarPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [missedCount, setMissedCount] = useState(0);
  const [filterMissed, setFilterMissed] = useState(false);
  const highlightIdRef = useRef<string | null>(null);

  const { settings: mobileSettings, isMobile } = useMobileSettings();
  const { settings: desktopSettings, toggleSetting, updateSettings, resetToDefaults } = useDesktopSettings();
  const dynamicBackgroundEnabled = isMobile ? mobileSettings.dynamicBackground : desktopSettings.dynamicBackground;
  const backgroundPattern = isMobile ? mobileSettings.backgroundPattern : desktopSettings.backgroundPattern;

  // Deep link: read date, highlight, & filter params on mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const highlightParam = searchParams.get('highlight');
    const filterParam = searchParams.get('filter');

    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) {
        setSelectedDate(parsed);
        setCurrentMonth(parsed);
      }
    }

    if (highlightParam) {
      highlightIdRef.current = highlightParam;
    }

    if (filterParam === 'missed') {
      setFilterMissed(true);
    }

    // Clear params after reading
    if (dateParam || highlightParam || filterParam) {
      setSearchParams({}, { replace: true });
    }
  }, []); // Only on mount

  // Check missed events count
  useEffect(() => {
    if (!user) return;
    const checkMissed = async () => {
      const { count } = await supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'missed');
      setMissedCount(count || 0);
    };
    checkMissed();
  }, [user]);

  // Fetch events for visible range
  const visibleRange = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return {
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    };
  }, [currentMonth]);

  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(visibleRange);

  // Highlight event after events load
  useEffect(() => {
    if (!highlightIdRef.current || events.length === 0) return;
    const id = highlightIdRef.current;
    highlightIdRef.current = null;

    // Small delay so DOM is rendered
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-event-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('pulse-highlight');
        setTimeout(() => el.classList.remove('pulse-highlight'), 2000);
      }
    });
  }, [events]);

  // Filtered events
  const displayEvents = useMemo(() => {
    if (!filterMissed) return events;
    return events.filter(e => e.status === 'missed');
  }, [events, filterMissed]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    displayEvents.forEach((ev) => {
      const key = format(new Date(ev.start_time), 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [displayEvents]);

  const getEventsForDate = (date: Date) => eventsByDate.get(format(date, 'yyyy-MM-dd')) || [];

  // Month grid days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  // Week days
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  }, [selectedDate]);

  const handleCreateEvent = useCallback((input: CreateCalendarEventInput) => {
    createEvent.mutate(input);
  }, [createEvent]);

  const handleUpdateEvent = useCallback((input: UpdateCalendarEventInput) => {
    updateEvent.mutate(input);
  }, [updateEvent]);

  const handleDeleteEvent = useCallback((id: string) => {
    deleteEvent.mutate(id);
  }, [deleteEvent]);

  const handleEventClick = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  const handleAddNew = (date?: Date) => {
    setEditingEvent(null);
    setSelectedDate(date || new Date());
    setShowEventModal(true);
  };

  // Upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return displayEvents
      .filter((e) => new Date(e.start_time) >= startOfDay(now))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [displayEvents]);

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-8">
      {dynamicBackgroundEnabled && <DynamicBackground enabled={dynamicBackgroundEnabled} pattern={backgroundPattern} />}

      <div className="max-w-3xl mx-auto px-4 pt-6 sm:pt-10 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DesktopHamburgerMenu settings={desktopSettings} onToggle={toggleSetting} onUpdateSettings={updateSettings} onReset={resetToDefaults} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <p className="text-sm text-muted-foreground">Your scheduled tasks & events</p>
            </div>
          </div>
          <Button onClick={() => handleAddNew()} size="sm" className="gradient-kaamyab hover:opacity-90">
            <Plus className="w-4 h-4 mr-1" /> New Event
          </Button>
        </div>

        {/* Missed Events Banner */}
        {missedCount > 0 && !filterMissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-foreground flex-1">
              You have <span className="font-semibold">{missedCount}</span> missed scheduled task{missedCount > 1 ? 's' : ''}.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setFilterMissed(true)}
            >
              Review Missed
            </Button>
          </motion.div>
        )}

        {/* Active filter indicator */}
        {filterMissed && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-foreground flex-1 font-medium">Showing missed events only</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setFilterMissed(false)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear Filter
            </Button>
          </div>
        )}

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="month" className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Month
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" /> Week
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1.5">
              <List className="w-3.5 h-3.5" /> List
            </TabsTrigger>
          </TabsList>

          {/* Month View */}
          <TabsContent value="month">
            <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 text-center text-xs text-muted-foreground border-b border-border/10">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="py-2 font-medium">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); handleAddNew(day); }}
                      className={cn(
                        "min-h-[60px] sm:min-h-[80px] p-1.5 border-b border-r border-border/10 text-left transition-colors hover:bg-muted/30",
                        !isCurrentMonth && "opacity-40",
                        isSelected && "bg-primary/5",
                        isToday && "bg-primary/10"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                        isToday && "bg-primary text-primary-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            data-event-id={ev.id}
                            onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                            className={cn(
                              "text-[10px] leading-tight truncate px-1 py-0.5 rounded transition-all",
                              ev.status === 'missed'
                                ? "bg-destructive/15 text-destructive"
                                : ev.task_ref ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 2}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Week View */}
          <TabsContent value="week">
            <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-foreground text-sm">
                  {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="divide-y divide-border/10">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div key={day.toISOString()} className={cn("p-3", isToday && "bg-primary/5")}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center",
                          isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {format(day, 'd')}
                        </span>
                        <span className="text-xs text-muted-foreground">{format(day, 'EEEE')}</span>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleAddNew(day)}>
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground/50 pl-9">No events</p>
                      ) : (
                        <div className="space-y-1.5 pl-9">
                          {dayEvents.map((ev) => (
                            <button
                              key={ev.id}
                              data-event-id={ev.id}
                              onClick={() => handleEventClick(ev)}
                              className={cn(
                                "w-full text-left rounded-lg p-2.5 transition-all hover:bg-muted/40",
                                ev.status === 'missed'
                                  ? "border-l-2 border-destructive bg-destructive/5"
                                  : ev.task_ref ? "border-l-2 border-primary bg-primary/5" : "border-l-2 border-border bg-muted/20"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {ev.task_ref ? <Link2 className="w-3 h-3 text-primary shrink-0" /> : <CalendarIcon className="w-3 h-3 text-muted-foreground shrink-0" />}
                                <span className="text-sm font-medium text-foreground truncate">{ev.title}</span>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(ev.start_time), 'h:mm a')}
                                {ev.end_time && ` – ${format(new Date(ev.end_time), 'h:mm a')}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
              <div className="p-4 border-b border-border/20">
                <h3 className="font-semibold text-foreground text-sm">Upcoming Events</h3>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{filterMissed ? 'No missed events' : 'No upcoming events'}</p>
                  {!filterMissed && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => handleAddNew()}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create Event
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {upcomingEvents.map((ev) => {
                    const startDate = new Date(ev.start_time);
                    return (
                      <button
                        key={ev.id}
                        data-event-id={ev.id}
                        onClick={() => handleEventClick(ev)}
                        className="w-full text-left p-4 hover:bg-muted/20 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0",
                            ev.status === 'missed'
                              ? "bg-destructive/10 text-destructive"
                              : ev.task_ref ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <span className="text-xs font-bold leading-none">{format(startDate, 'd')}</span>
                            <span className="text-[9px] uppercase">{format(startDate, 'MMM')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {ev.task_ref && <Link2 className="w-3 h-3 text-primary shrink-0" />}
                              <span className="font-medium text-foreground text-sm truncate">{ev.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(startDate, 'EEEE, h:mm a')}
                              {ev.end_time && ` – ${format(new Date(ev.end_time), 'h:mm a')}`}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={editingEvent}
        defaultDate={selectedDate}
        onSave={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        isSaving={createEvent.isPending || updateEvent.isPending}
      />

      <BottomNav />
    </div>
  );
};

export default CalendarPage;
