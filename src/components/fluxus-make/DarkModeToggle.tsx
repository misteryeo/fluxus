'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  // Always start with false for consistent SSR
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Check theme preference after component mounts on client
  useEffect(() => {
    // Check localStorage first (if user has previously set a preference)
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setIsDark(stored === 'dark');
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setIsDark(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  // Apply dark mode class to document
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', isDark);
    // Persist preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, mounted]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  // Render a consistent default during SSR and before mount
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-10 h-10 rounded-xl"
        disabled
      >
        <Moon className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="w-10 h-10 rounded-xl"
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
}
