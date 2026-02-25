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
        try {
            const stored = localStorage.getItem('stellarproof-theme') as Theme | null;

            if (stored === 'light') {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTheme('light');
                applyTheme('light');
            } else {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTheme('dark');
                applyTheme('dark');
            }
        } catch (error) {
            console.warn('Could not read theme from localStorage', error);
        }
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