import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/theme/tokens';
import { Text } from './Text';

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
          marginTop: spacing.xl,
        },
        style,
      ]}
    >
      <Text variant="overline" color="textMuted" uppercase>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="caption" color="primary">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
