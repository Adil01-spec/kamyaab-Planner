import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import * as React from 'react';
import { useEffect, useState } from 'react';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * Get time-based default theme
 * Light during day (6am-6pm), dark at night
 */
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  // Day: 6am (6) to 6pm (18)
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

/**
 * Internal component that handles time-based theme switching
 */
function TimeBasedThemeHandler({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    // Only set time-based theme on first load if no preference is stored
    if (!hasInitialized) {
      const storedTheme = localStorage.getItem('theme');
      
      // If no stored preference or explicitly set to "system", use time-based
      if (!storedTheme || storedTheme === 'system') {
        const timeTheme = getTimeBasedTheme();
        setTheme(timeTheme);
      }
      
      setHasInitialized(true);
    }
  }, [hasInitialized, setTheme]);
  
  return <>{children}</>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <TimeBasedThemeHandler>
        {children}
      </TimeBasedThemeHandler>
    </NextThemesProvider>
  );
}