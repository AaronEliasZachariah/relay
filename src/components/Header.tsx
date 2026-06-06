import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { layout, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  /** iOS-style large title rendered below the action row. */
  large?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
};

export function Header({ title, subtitle, large, showBack, onBack, right }: HeaderProps) {
  const router = useRouter();

  const back = showBack ? (
    <Pressable
      onPress={onBack ?? (() => router.back())}
      hitSlop={12}
      style={{ marginLeft: -spacing.xs, marginRight: spacing.xs }}
    >
      <Icon name="chevron-back" size={26} color="text" />
    </Pressable>
  ) : null;

  return (
    <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 36 }}>
        {back}
        {!large && (
          <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </Text>
        )}
        {large && <View style={{ flex: 1 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>{right}</View>
      </View>
      {large && (
        <View style={{ marginTop: spacing.md }}>
          <Text variant="h1">{title}</Text>
          {subtitle ? (
            <Text variant="callout" color="textSecondary" style={{ marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
