import { createContext, useContext, useState, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Theme provider component
export function ThemeProvider({ children }) {
  // Check if user has a theme preference in localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check if user prefers dark mode via system settings
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  // State to track current theme
  const [theme, setTheme] = useState(getInitialTheme);
  
  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };
  
  // Function to set a specific theme
  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      localStorage.setItem('theme', mode);
      setTheme(mode);
    }
  };

  // Apply theme to document when it changes
  useEffect(() => {
    // Apply theme class to the document element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also update the color-scheme meta tag for browser UI elements
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = theme;
      document.head.appendChild(meta);
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Provide theme context to children
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}