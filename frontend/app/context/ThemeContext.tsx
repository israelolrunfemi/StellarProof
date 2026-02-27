'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');

    const applyTheme = (t: Theme) => {
        const root = document.documentElement;
        root.dataset.theme = t;
        if (t === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    useEffect(() => {
    const stored = localStorage.getItem('theme');
    
    // Wrap in setTimeout to avoid synchronous setState inside an effect
    const timer = setTimeout(() => {
        if (stored === 'light') {
        setTheme('light');
        // Ensure applyTheme is defined or handled here
        } else {
        setTheme('dark');
        }
    }, 0);

    return () => clearTimeout(timer);
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem('stellarproof-theme', next);
            } catch (error) {
                console.warn('Could not save theme to localStorage', error);
            }
            applyTheme(next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}--
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}