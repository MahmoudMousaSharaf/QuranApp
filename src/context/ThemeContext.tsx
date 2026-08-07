import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { getTheme, saveTheme } from '../services/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    (async () => {
      const saved = await getTheme();
      setTheme(saved);
    })();
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const colors = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    primary: '#0d9488',
    primaryDark: '#0f766e',
    border: '#e2e8f0',
    accent: '#14b8a6',
    error: '#ef4444',
    headerBg: '#0d9488',
    headerText: '#ffffff',
    ayahBg: '#f0fdfa',
    bookmarkActive: '#0d9488',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    primary: '#14b8a6',
    primaryDark: '#0d9488',
    border: '#334155',
    accent: '#2dd4bf',
    error: '#f87171',
    headerBg: '#0f766e',
    headerText: '#f0fdfa',
    ayahBg: '#134e4a',
    bookmarkActive: '#14b8a6',
  },
};
