import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useColors } from '@/theme/ThemeProvider';
import { type ThemeColors, type as typeScale, type TypeName } from '@/theme/tokens';

type ColorToken = keyof ThemeColors;

export type TextProps = RNTextProps & {
  variant?: TypeName;
  /** A semantic theme color key (e.g. "textSecondary") or any raw color string. */
  color?: ColorToken | (string & {});
  center?: boolean;
  /** Convenience for uppercased labels (pairs well with the "overline" variant). */
  uppercase?: boolean;
};

/**
 * Typographic primitive. Resolves a type variant + a semantic color so screens
 * read declaratively: `<Text variant="title" color="text">`.
 */
export function Text({
  variant = 'body',
  color = 'text',
  center,
  uppercase,
  style,
  ...rest
}: TextProps) {
  const colors = useColors();
  const resolved =
    typeof color === 'string' && color in colors
      ? (colors[color as ColorToken] as string)
      : (color as string);

  return (
    <RNText
      {...rest}
      style={[
        typeScale[variant],
        { color: resolved },
        center && { textAlign: 'center' },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
