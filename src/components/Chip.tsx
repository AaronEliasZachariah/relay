import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.primary : colors.bgMuted,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon && <Icon name={icon} size={15} color={selected ? colors.onPrimary : colors.textSecondary} />}
      <Text variant="subhead" style={{ color: selected ? colors.onPrimary : colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}
