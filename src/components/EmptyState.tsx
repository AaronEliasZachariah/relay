import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing['5xl'], paddingHorizontal: spacing.xl }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius['2xl'],
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Icon name={icon} size={32} color="primary" />
      </View>
      <Text variant="h2" center>
        {title}
      </Text>
      {message ? (
        <Text variant="callout" color="textSecondary" center style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel ? (
        <Button label={actionLabel} onPress={onAction} full={false} style={{ marginTop: spacing.xl }} />
      ) : null}
    </View>
  );
}
