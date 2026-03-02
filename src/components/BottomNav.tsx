import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Calendar, CalendarDays, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTodaysTasks } from '@/lib/todayTaskSelector';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  showIndicator?: boolean;
  badgeCount?: number;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);
  const [missedCount, setMissedCount] = useState(0);

  // Check for incomplete tasks
  useEffect(() => {
    const checkTasks = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('plans')
          .select('plan_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data?.plan_json) {
          const tasks = getTodaysTasks(data.plan_json as any);
          const incomplete = tasks.filter(t => !t.task.completed);
          setHasIncompleteTasks(incomplete.length > 0);
        }
      } catch (err) {
        console.error('Error checking tasks:', err);
      }
    };

    checkTasks();
    
    const channel = supabase
      .channel('plan-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plans',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        checkTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check for missed calendar events
  useEffect(() => {
    const checkMissed = async () => {
      if (!user) return;
      try {
        const { count } = await supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'missed');
        setMissedCount(count || 0);
      } catch {
        // silent
      }
    };

    checkMissed();

    const channel = supabase
      .channel('calendar-missed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_events',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        checkMissed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems: NavItem[] = [
    { label: 'Today', path: '/today', icon: Sun, showIndicator: hasIncompleteTasks },
    { label: 'Plan', path: '/plan', icon: Calendar },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays, badgeCount: missedCount },
    { label: 'Home', path: '/home', icon: Home },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-press relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
                {/* Indicator dot */}
                {item.showIndicator && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
                {/* Missed count badge */}
                {item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
