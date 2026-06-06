import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/theme/ThemeProvider';
import { type ThemeColors } from '@/theme/tokens';

export type IconName = keyof typeof Ionicons.glyphMap;

type ColorToken = keyof ThemeColors;

export function Icon({
  name,
  size = 22,
  color = 'text',
}: {
  name: IconName;
  size?: number;
  color?: ColorToken | (string & {});
}) {
  const colors = useColors();
  const resolved =
    typeof color === 'string' && color in colors
      ? (colors[color as ColorToken] as string)
      : (color as string);
  return <Ionicons name={name} size={size} color={resolved} />;
}
