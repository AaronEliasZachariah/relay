import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/ThemeProvider';
import { hairlineWidth } from '@/theme/tokens';

export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View
      style={[{ height: hairlineWidth, backgroundColor: colors.hairline, marginLeft: inset }, style]}
    />
  );
}
