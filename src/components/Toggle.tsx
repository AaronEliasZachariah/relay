import React from 'react';
import { Switch } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/utils/haptics';

export function Toggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        haptic.selection();
        onValueChange(v);
      }}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.borderStrong}
    />
  );
}
