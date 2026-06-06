import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Adds an alpha channel to a #RRGGBB hex. */
function tint(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex + alpha : hex;
}

export type AvatarProps = {
  name?: string;
  /** Single emoji glyph (used for groups). Takes precedence over initials. */
  emoji?: string;
  accent?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ name, emoji, accent = '#5B5BF0', size = 48, style }: AvatarProps) {
  const base: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size * 0.34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tint(accent, '22'),
    overflow: 'hidden',
  };

  return (
    <View style={[base, style]}>
      {emoji ? (
        <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
      ) : (
        <Text variant="bodyStrong" style={{ color: accent, fontSize: size * 0.36 }}>
          {initials(name ?? '')}
        </Text>
      )}
    </View>
  );
}
