import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const HEIGHTS: Record<Size, number> = { sm: 42, md: 52, lg: 56 };

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to fill the parent width (default) vs. hug content. */
  full?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const height = HEIGHTS[size];
  const isDisabled = disabled || loading;

  const press = () => {
    haptic.light();
    onPress?.();
  };

  const contentColor =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'ghost'
        ? colors.primary
        : colors.text;

  const inner = loading ? (
    <ActivityIndicator color={contentColor} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} color={contentColor} />}
      <Text variant="button" style={{ color: contentColor }}>
        {label}
      </Text>
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 18 : 20} color={contentColor} />}
    </View>
  );

  const base: ViewStyle = {
    height,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    alignSelf: full ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
  };

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={press}
        disabled={isDisabled}
        style={({ pressed }) => [
          { borderRadius: radius.lg, alignSelf: full ? 'stretch' : 'flex-start' },
          !isDisabled && shadows.primaryGlow,
          pressed && { transform: [{ scale: 0.985 }] },
          style,
        ]}
      >
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={base}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.bgMuted : 'transparent';

  return (
    <Pressable
      onPress={press}
      disabled={isDisabled}
      style={({ pressed }) => [
        base,
        { backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}
