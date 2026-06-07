/**
 * Theme context. Resolves the active color set from the user's preference
 * ('system' | 'light' | 'dark') against the OS scheme, and exposes helpers so
 * components stay declarative: `const { colors } = useTheme()`.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './tokens';

export type SchemePref = 'system' | 'light' | 'dark';

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  scheme: SchemePref;
  setScheme: (s: SchemePref) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [scheme, setScheme] = useState<SchemePref>('system');

  const value = useMemo<Theme>(() => {
    const resolved = scheme === 'system' ? system ?? 'light' : scheme;
    const isDark = resolved === 'dark';
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      scheme,
      setScheme,
    };
  }, [scheme, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

/** Convenience: just the colors. */
export function useColors(): ThemeColors {
  return useTheme().colors;
}

/**
 * Build a memoized StyleSheet from the current theme. Keeps static layout in
 * StyleSheet.create (cheap) while letting colors react to light/dark.
 *
 *   const s = useThemedStyles((t) => ({ box: { backgroundColor: t.colors.bg } }));
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  // factory is expected to be stable across renders; key only on theme.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
