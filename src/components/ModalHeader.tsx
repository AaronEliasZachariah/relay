import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { layout, spacing } from '@/theme/tokens';
import { Text } from './Text';

export function ModalHeader({
  title,
  onCancel,
  onSave,
  saveLabel = 'Save',
  saveDisabled,
}: {
  title: string;
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.screenPadding,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}
    >
      <Pressable onPress={onCancel ?? (() => router.back())} hitSlop={10} style={{ minWidth: 64 }}>
        <Text variant="callout" color="textSecondary">
          Cancel
        </Text>
      </Pressable>
      <Text variant="title" center style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      <Pressable onPress={onSave} disabled={saveDisabled} hitSlop={10} style={{ minWidth: 64, alignItems: 'flex-end' }}>
        <Text variant="bodyStrong" color={saveDisabled ? 'textMuted' : 'primary'}>
          {saveLabel}
        </Text>
      </Pressable>
    </View>
  );
}
