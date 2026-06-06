import React, { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type ListRowProps = {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron,
  danger,
  style,
}: ListRowProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: layout.rowMinHeight,
        paddingVertical: spacing.sm,
      }}
    >
      {leading}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="textSecondary" numberOfLines={1} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron && <Icon name="chevron-forward" size={18} color="textMuted" />}
    </View>
  );

  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}>
      {content}
    </Pressable>
  );
}
