import React, { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  /** Visual emphasis. "outlined" drops the shadow for a flatter, denser look. */
  variant?: 'elevated' | 'outlined' | 'plain';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  onPress,
  variant = 'elevated',
  padded = true,
  style,
}: CardProps) {
  const colors = useColors();

  const base: ViewStyle = {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: padded ? spacing.lg : 0,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    ...(variant === 'elevated' ? shadows.sm : null),
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        base,
        pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
