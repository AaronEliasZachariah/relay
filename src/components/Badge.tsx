import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary' | 'info';

function toneColors(colors: ReturnType<typeof useTheme>['colors'], tone: Tone) {
  switch (tone) {
    case 'success':
      return { bg: colors.successSoft, fg: colors.success };
    case 'warning':
      return { bg: colors.warningSoft, fg: colors.warning };
    case 'danger':
      return { bg: colors.dangerSoft, fg: colors.danger };
    case 'primary':
      return { bg: colors.primarySoft, fg: colors.primary };
    case 'info':
      return { bg: colors.infoSoft, fg: colors.info };
    default:
      return { bg: colors.bgMuted, fg: colors.textSecondary };
  }
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const c = toneColors(colors, tone);
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: c.bg,
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: radius.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={12} color={c.fg} />}
      <Text variant="caption" style={{ color: c.fg }}>
        {label}
      </Text>
    </View>
  );
}

/** Small status dot for inline indicators. */
export function Dot({ tone = 'neutral', size = 8 }: { tone?: Tone; size?: number }) {
  const { colors } = useTheme();
  const c = toneColors(colors, tone);
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.fg }} />;
}
