import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Calendar, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTodaysTasks } from '@/lib/todayTaskSelector';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  showIndicator?: boolean;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);

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
    
    // Subscribe to plan changes for real-time updates
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

  const navItems: NavItem[] = [
    { label: 'Today', path: '/today', icon: Sun, showIndicator: hasIncompleteTasks },
    { label: 'Plan', path: '/plan', icon: Calendar },
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
