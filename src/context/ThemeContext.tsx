import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'sunny' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isSunny: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to radiant 'sunny' daylight mode as requested
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('solar_theme_mode');
      return saved === 'dark' ? 'dark' : 'sunny';
    } catch {
      return 'sunny';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('solar_theme_mode', theme);
    } catch {
      // safe fallback
    }
    if (theme === 'sunny') {
      document.documentElement.classList.add('sunny-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('sunny-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'sunny' ? 'dark' : 'sunny'));
  };

  const isSunny = theme === 'sunny';

  return (
    <ThemeContext.Provider value={{ theme, isSunny, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
